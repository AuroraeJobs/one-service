import { useEffect, useRef } from 'react';
import { useI18n } from '../contexts/I18nContext';

interface LocalizedValueState {
  original: string;
  translated: string;
}

type TranslateText = (source: string) => string;

const textNodeStates = new WeakMap<Text, LocalizedValueState>();
const elementAttributeStates = new WeakMap<Element, Record<string, LocalizedValueState>>();
const translatableAttributes = ['placeholder', 'title', 'aria-label', 'alt'];
const containsChineseSourceText = (value: string) => /[\u3400-\u9fff]/u.test(value);

const shouldSkipTextNode = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) return true;
  return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE'].includes(parent.tagName)
    || Boolean(parent.closest('[contenteditable="true"], [data-i18n-ignore="true"]'));
};

const restoreElementAttributes = (element: Element) => {
  const states = elementAttributeStates.get(element);
  if (!states) return;
  Object.entries(states).forEach(([attribute, state]) => {
    if (element.getAttribute(attribute) === state.translated) {
      element.setAttribute(attribute, state.original);
    }
  });
  elementAttributeStates.delete(element);
};

const restoreNode = (root: Element) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    const state = textNodeStates.get(textNode);
    if (state) {
      if (textNode.nodeValue === state.translated) {
        textNode.nodeValue = state.original;
      }
      textNodeStates.delete(textNode);
    }
    current = walker.nextNode();
  }

  restoreElementAttributes(root);
  root.querySelectorAll('*').forEach(restoreElementAttributes);
};

const translateElementAttributes = (element: Element, translateText: TranslateText) => {
  const stored = elementAttributeStates.get(element) ?? {};
  let nextStored = stored;
  translatableAttributes.forEach(attribute => {
    const currentValue = element.getAttribute(attribute);
    if (!currentValue) return;
    const previous = nextStored[attribute];
    const original = previous && currentValue === previous.translated
      ? previous.original
      : currentValue;
    const translated = containsChineseSourceText(original) ? translateText(original) : original;
    nextStored = { ...nextStored, [attribute]: { original, translated } };
    if (translated !== currentValue) {
      element.setAttribute(attribute, translated);
    }
  });
  if (Object.keys(nextStored).length > 0) {
    elementAttributeStates.set(element, nextStored);
  }
};

const translateNode = (root: Element, translateText: TranslateText) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    if (!shouldSkipTextNode(textNode)) {
      const currentValue = textNode.nodeValue ?? '';
      const previous = textNodeStates.get(textNode);
      const original = previous && currentValue === previous.translated
        ? previous.original
        : currentValue;
      const translated = containsChineseSourceText(original) ? translateText(original) : original;
      textNodeStates.set(textNode, { original, translated });
      if (translated !== currentValue) {
        textNode.nodeValue = translated;
      }
    }
    current = walker.nextNode();
  }

  translateElementAttributes(root, translateText);
  root.querySelectorAll('*').forEach(element => translateElementAttributes(element, translateText));
};

/**
 * Compatibility bridge for legacy screens that still contain inline source text.
 * New UI code should use useI18n().t() directly.
 */
const AppTextLocalizer = () => {
  const { language, defaultLanguage, translateText } = useI18n();
  const timerRef = useRef<number | undefined>(undefined);
  const enabled = language !== defaultLanguage;

  useEffect(() => {
    // Ant Design renders overlays in body-level portals, so the bridge observes
    // the entire body instead of only the React application mount point.
    const root = document.body;
    if (!root) return undefined;

    if (!enabled) {
      restoreNode(root);
      return undefined;
    }

    translateNode(root, translateText);
    const pendingRoots = new Set<Element>();
    const flushPendingRoots = () => {
      pendingRoots.forEach(pendingRoot => {
        if (pendingRoot === root || root.contains(pendingRoot)) {
          translateNode(pendingRoot, translateText);
        }
      });
      pendingRoots.clear();
    };
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          pendingRoots.add(mutation.target);
          return;
        }
        if (mutation.type === 'characterData') {
          const parent = mutation.target.parentElement;
          if (parent) pendingRoots.add(parent);
          return;
        }
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element) {
            pendingRoots.add(node);
          } else if (node.parentNode instanceof Element) {
            pendingRoots.add(node.parentNode);
          }
        });
      });
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(flushPendingRoots, 30);
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatableAttributes,
    });

    return () => {
      window.clearTimeout(timerRef.current);
      observer.disconnect();
      restoreNode(root);
    };
  }, [enabled, language, translateText]);

  return null;
};

export default AppTextLocalizer;
