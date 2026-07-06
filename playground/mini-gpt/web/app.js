const state = {
  rows: [],
  meta: undefined,
  source: '未加载',
};

const ids = {
  stepCount: document.getElementById('stepCount'),
  latestTrainLoss: document.getElementById('latestTrainLoss'),
  latestEvalLoss: document.getElementById('latestEvalLoss'),
  lossDrop: document.getElementById('lossDrop'),
  sourceLabel: document.getElementById('sourceLabel'),
  metaList: document.getElementById('metaList'),
  logRows: document.getElementById('logRows'),
  canvas: document.getElementById('lossChart'),
  reloadButton: document.getElementById('reloadButton'),
  csvInput: document.getElementById('csvInput'),
};

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines.shift()?.split(',') || [];
  return lines.map((line) => {
    const values = line.split(',');
    return headers.reduce((row, header, index) => {
      row[header] = Number(values[index]);
      return row;
    }, {});
  });
};

const loadText = async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`无法加载 ${path}`);
  }
  return response.text();
};

const loadJson = async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`无法加载 ${path}`);
  }
  return response.json();
};

const formatNumber = (value) => Number.isFinite(value) ? value.toFixed(4) : '-';

const updateStats = () => {
  const first = state.rows[0];
  const latest = state.rows[state.rows.length - 1];
  ids.stepCount.textContent = latest?.step ?? '-';
  ids.latestTrainLoss.textContent = formatNumber(latest?.train_loss);
  ids.latestEvalLoss.textContent = formatNumber(latest?.eval_loss);
  if (first && latest) {
    const drop = first.eval_loss - latest.eval_loss;
    ids.lossDrop.textContent = `${drop >= 0 ? '-' : '+'}${Math.abs(drop).toFixed(4)}`;
    ids.lossDrop.style.color = drop >= 0 ? 'var(--good)' : 'var(--accent-2)';
  } else {
    ids.lossDrop.textContent = '-';
    ids.lossDrop.style.color = '';
  }
  ids.sourceLabel.textContent = state.source;
};

const updateMeta = () => {
  if (!state.meta) {
    ids.metaList.innerHTML = '<div><dt>状态</dt><dd>未找到 runs/latest.json，可手动选择 CSV</dd></div>';
    return;
  }
  const config = state.meta.config || {};
  const entries = [
    ['设备', state.meta.device],
    ['数据', state.meta.data],
    ['checkpoint', state.meta.checkpoint],
    ['开始', state.meta.started_at],
    ['结束', state.meta.finished_at],
    ['max_steps', state.meta.max_steps],
    ['batch_size', state.meta.batch_size],
    ['block_size', config.block_size],
    ['n_layer', config.n_layer],
    ['n_head', config.n_head],
    ['n_embd', config.n_embd],
  ];
  ids.metaList.innerHTML = entries
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`)
    .join('');
};

const updateTable = () => {
  if (!state.rows.length) {
    ids.logRows.innerHTML = '<tr><td colspan="4">暂无日志</td></tr>';
    return;
  }
  ids.logRows.innerHTML = state.rows
    .slice()
    .reverse()
    .map((row) => `
      <tr>
        <td>${row.step}</td>
        <td>${formatNumber(row.train_loss)}</td>
        <td>${formatNumber(row.eval_loss)}</td>
        <td>${row.elapsed_seconds ?? '-'}</td>
      </tr>
    `)
    .join('');
};

const drawChart = () => {
  const canvas = ids.canvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const padding = { top: 24, right: 34, bottom: 42, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  ctx.strokeStyle = '#d8dde6';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (plotHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  if (state.rows.length < 2) {
    ctx.fillStyle = '#6e7380';
    ctx.font = '20px system-ui';
    ctx.fillText('训练日志不足，至少需要两个点', padding.left, height / 2);
    return;
  }

  const values = state.rows.flatMap((row) => [row.train_loss, row.eval_loss]).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.001);
  const minStep = state.rows[0].step;
  const maxStep = state.rows[state.rows.length - 1].step;
  const stepRange = Math.max(maxStep - minStep, 1);
  const point = (row, key) => {
    const x = padding.left + ((row.step - minStep) / stepRange) * plotWidth;
    const y = padding.top + (1 - (row[key] - min) / range) * plotHeight;
    return [x, y];
  };

  const drawLine = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    state.rows.forEach((row, index) => {
      const [x, y] = point(row, key);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  drawLine('train_loss', '#0a84ff');
  drawLine('eval_loss', '#ff3b30');

  ctx.fillStyle = '#1d1d1f';
  ctx.font = '14px system-ui';
  ctx.fillText(`max ${max.toFixed(3)}`, 12, padding.top + 6);
  ctx.fillText(`min ${min.toFixed(3)}`, 12, height - padding.bottom);
  ctx.fillStyle = '#0a84ff';
  ctx.fillText('train_loss', padding.left, 20);
  ctx.fillStyle = '#ff3b30';
  ctx.fillText('eval_loss', padding.left + 100, 20);
  ctx.fillStyle = '#6e7380';
  ctx.fillText(`step ${minStep}`, padding.left, height - 14);
  ctx.fillText(`step ${maxStep}`, width - padding.right - 76, height - 14);
};

const render = () => {
  updateStats();
  updateMeta();
  updateTable();
  drawChart();
};

const loadLatest = async () => {
  try {
    state.meta = await loadJson('../runs/latest.json');
    const csvPath = `../${state.meta.log_file || 'runs/train_log.csv'}`;
    state.rows = parseCsv(await loadText(csvPath));
    state.source = state.meta.log_file || 'runs/train_log.csv';
  } catch (error) {
    state.meta = undefined;
    state.rows = [];
    state.source = '手动选择 CSV';
  }
  render();
};

ids.reloadButton.addEventListener('click', loadLatest);
ids.csvInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  state.rows = parseCsv(await file.text());
  state.source = file.name;
  render();
});

loadLatest();
