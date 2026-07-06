const state = {
  rows: [],
  meta: undefined,
  runs: [],
  selectedRun: '',
  source: '未加载',
};

const ids = {
  stepCount: document.getElementById('stepCount'),
  latestTrainLoss: document.getElementById('latestTrainLoss'),
  latestEvalLoss: document.getElementById('latestEvalLoss'),
  lossDrop: document.getElementById('lossDrop'),
  lossGap: document.getElementById('lossGap'),
  sourceLabel: document.getElementById('sourceLabel'),
  sampleStep: document.getElementById('sampleStep'),
  sampleText: document.getElementById('sampleText'),
  metaList: document.getElementById('metaList'),
  logRows: document.getElementById('logRows'),
  canvas: document.getElementById('lossChart'),
  runSelect: document.getElementById('runSelect'),
  reloadButton: document.getElementById('reloadButton'),
  csvInput: document.getElementById('csvInput'),
};

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
};

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || '');
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      if (header === 'sample') {
        try {
          row[header] = JSON.parse(values[index] || '""');
        } catch (error) {
          row[header] = values[index] || '';
        }
      } else {
        row[header] = Number(values[index]);
      }
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

const renderRunOptions = () => {
  if (!state.runs.length) {
    ids.runSelect.innerHTML = '<option value="">最近一次训练</option>';
    ids.runSelect.disabled = true;
    return;
  }
  ids.runSelect.disabled = false;
  ids.runSelect.innerHTML = state.runs
    .map((run) => {
      const label = [
        run.run_name,
        run.preset ? `preset=${run.preset}` : '',
        run.final_eval_loss !== undefined ? `eval=${formatNumber(run.final_eval_loss)}` : '',
      ].filter(Boolean).join(' · ');
      return `<option value="${run.run_name}">${label}</option>`;
    })
    .join('');
  ids.runSelect.value = state.selectedRun || state.runs[0]?.run_name || '';
};

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
  if (latest && Number.isFinite(latest.eval_loss) && Number.isFinite(latest.train_loss)) {
    const gap = latest.eval_loss - latest.train_loss;
    ids.lossGap.textContent = `${gap >= 0 ? '+' : '-'}${Math.abs(gap).toFixed(4)}`;
    ids.lossGap.style.color = gap <= 0.2 ? 'var(--good)' : 'var(--accent-2)';
  } else {
    ids.lossGap.textContent = '-';
    ids.lossGap.style.color = '';
  }
  ids.sourceLabel.textContent = state.source;
  ids.sampleStep.textContent = latest?.step ? `step ${latest.step}` : 'step -';
  ids.sampleText.textContent = latest?.sample || '暂无生成样例';
};

const updateMeta = () => {
  if (!state.meta) {
    ids.metaList.innerHTML = '<div><dt>状态</dt><dd>未找到 runs/latest.json，可手动选择 CSV</dd></div>';
    return;
  }
  const config = state.meta.config || {};
  const entries = [
    ['run_name', state.meta.run_name],
    ['preset', state.meta.preset],
    ['设备', state.meta.device],
    ['数据', state.meta.data],
    ['checkpoint', state.meta.checkpoint],
    ['开始', state.meta.started_at],
    ['结束', state.meta.finished_at],
    ['max_steps', state.meta.max_steps],
    ['batch_size', state.meta.batch_size],
    ['val_ratio', state.meta.val_ratio],
    ['validation_enabled', state.meta.validation_enabled],
    ['train_tokens', state.meta.train_tokens],
    ['eval_tokens', state.meta.eval_tokens],
    ['sample_prompt', state.meta.sample_prompt],
    ['sample_tokens', state.meta.sample_tokens],
    ['final_train_loss', state.meta.final_train_loss],
    ['final_eval_loss', state.meta.final_eval_loss],
    ['loss_gap', state.meta.loss_gap],
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
    ids.logRows.innerHTML = '<tr><td colspan="5">暂无日志</td></tr>';
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
        <td><pre class="table-sample">${row.sample || '-'}</pre></td>
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
  renderRunOptions();
  updateStats();
  updateMeta();
  updateTable();
  drawChart();
};

const loadRunIndex = async () => {
  try {
    const runs = await loadJson('../runs/index.json');
    state.runs = Array.isArray(runs) ? runs : [];
  } catch (error) {
    state.runs = [];
  }
};

const loadTrainingRun = async (runName = '') => {
  try {
    await loadRunIndex();
    state.selectedRun = runName || state.selectedRun || state.runs[0]?.run_name || '';
    const selected = state.runs.find((run) => run.run_name === state.selectedRun);
    const metadataPath = selected?.metadata_file ? `../${selected.metadata_file}` : '../runs/latest.json';
    state.meta = await loadJson(metadataPath);
    const csvPath = `../${state.meta.log_file || 'runs/train_log.csv'}`;
    state.rows = parseCsv(await loadText(csvPath));
    state.source = state.meta.log_file || 'runs/train_log.csv';
    state.selectedRun = state.meta.run_name || state.selectedRun;
  } catch (error) {
    state.meta = undefined;
    state.rows = [];
    state.source = '手动选择 CSV';
  }
  render();
};

ids.reloadButton.addEventListener('click', () => loadTrainingRun(state.selectedRun));
ids.runSelect.addEventListener('change', () => loadTrainingRun(ids.runSelect.value));
ids.csvInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  state.rows = parseCsv(await file.text());
  state.meta = undefined;
  state.selectedRun = '';
  state.source = file.name;
  render();
});

loadTrainingRun();
