/* Runtime Model Metadata Editor
   - Waits for `window.tycoon` to be available
   - Allows editing per-model metadata (rotation, rotationDegrees, preScale, offset)
   - Applies changes at runtime for preview and offers a downloadable meta.json
*/
(function(){
  function $(s){return document.querySelector(s)}

  function createPanel(){
    const panel = document.createElement('div');
    panel.id = 'model-editor-panel';
    Object.assign(panel.style, {
      position: 'fixed', right: '20px', bottom: '20px', width: '320px', zIndex: 2001,
      background: 'rgba(10,14,39,0.95)', color: '#fff', padding: '12px', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.7)', fontFamily: 'sans-serif', fontSize: '13px'
    });

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong>Model Editor</strong>
        <button id="me-close" title="Close" style="background:transparent;border:none;color:#bbb;cursor:pointer">✕</button>
      </div>
      <div style="margin-bottom:8px;"><label style="font-size:12px;color:#9fb8e6">Model</label><br><select id="me-model-select" style="width:100%;padding:6px;margin-top:6px;background:#0b1220;border:1px solid #223; color:#fff"></select></div>

      <div style="display:flex;gap:6px;margin-bottom:6px;">
        <div style="flex:1"><label style="font-size:12px;color:#9fb8e6">Rot X</label><input id="me-rotx" type="number" step="1" style="width:100%"/></div>
        <div style="flex:1"><label style="font-size:12px;color:#9fb8e6">Rot Y</label><input id="me-roty" type="number" step="1" style="width:100%"/></div>
        <div style="flex:1"><label style="font-size:12px;color:#9fb8e6">Rot Z</label><input id="me-rotz" type="number" step="1" style="width:100%"/></div>
      </div>
      <div style="margin-bottom:6px;"><label style="font-size:12px;color:#9fb8e6"><input id="me-rotdeg" type="checkbox"/> Rotation in degrees</label></div>
      <div style="display:flex;gap:6px;margin-bottom:6px;">
        <div style="flex:1"><label style="font-size:12px;color:#9fb8e6">Pre-Scale</label><input id="me-prescale" type="number" step="0.1" value="1" style="width:100%"/></div>
        <div style="flex:1"><label style="font-size:12px;color:#9fb8e6">Offset Y</label><input id="me-offy" type="number" step="0.1" value="0" style="width:100%"/></div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <div style="flex:1"><label style="font-size:12px;color:#9fb8e6">Off X</label><input id="me-offx" type="number" step="0.1" value="0" style="width:100%"/></div>
        <div style="flex:1"><label style="font-size:12px;color:#9fb8e6">Off Z</label><input id="me-offz" type="number" step="0.1" value="0" style="width:100%"/></div>
      </div>

      <div style="display:flex;gap:6px;">
        <button id="me-apply" style="flex:1;padding:8px;background:#1f6feb;border:none;border-radius:6px;cursor:pointer">Apply</button>
        <button id="me-preview" style="flex:1;padding:8px;background:#2a8f45;border:none;border-radius:6px;cursor:pointer">Preview</button>
      </div>
      <div style="display:flex;gap:6px;margin-top:8px;">
        <button id="me-download" style="flex:1;padding:8px;background:#444;border:none;border-radius:6px;cursor:pointer">Download meta.json</button>
        <button id="me-copy" style="flex:1;padding:8px;background:#666;border:none;border-radius:6px;cursor:pointer">Copy JSON</button>
      </div>
      <div id="me-status" style="margin-top:8px;color:#9fb8e6;font-size:12px"></div>
    `;

    document.body.appendChild(panel);

    document.getElementById('me-close').addEventListener('click', ()=>panel.remove());
    document.getElementById('me-model-select').addEventListener('change', onModelChange);
    document.getElementById('me-apply').addEventListener('click', onApply);
    document.getElementById('me-preview').addEventListener('click', onPreview);
    document.getElementById('me-download').addEventListener('click', onDownload);
    document.getElementById('me-copy').addEventListener('click', onCopy);
  }

  function waitForTycoon() {
    return new Promise((resolve)=>{
      if (window.tycoon) return resolve(window.tycoon);
      const iv = setInterval(()=>{
        if (window.tycoon) { clearInterval(iv); resolve(window.tycoon); }
      }, 200);
    });
  }

  function populateSelect(tycoon){
    const sel = document.getElementById('me-model-select');
    sel.innerHTML = '';
    const map = tycoon.buildingModelMap || {};
    for (const key of Object.keys(map)){
      const opt = document.createElement('option'); opt.value=key; opt.textContent=key; sel.appendChild(opt);
    }
    if (sel.options.length) sel.value = sel.options[0].value;
    onModelChange();
  }

  function onModelChange(){
    const key = document.getElementById('me-model-select').value;
    const meta = (window.tycoon && window.tycoon.buildingModelMeta && window.tycoon.buildingModelMeta[key]) || {};
    document.getElementById('me-rotx').value = (meta.rotation && meta.rotation.x) || 0;
    document.getElementById('me-roty').value = (meta.rotation && meta.rotation.y) || 0;
    document.getElementById('me-rotz').value = (meta.rotation && meta.rotation.z) || 0;
    document.getElementById('me-rotdeg').checked = !!meta.rotationDegrees;
    document.getElementById('me-prescale').value = meta.preScale || 1;
    document.getElementById('me-offx').value = (meta.offset && meta.offset.x) || 0;
    document.getElementById('me-offy').value = (meta.offset && meta.offset.y) || 0;
    document.getElementById('me-offz').value = (meta.offset && meta.offset.z) || 0;
    setStatus('Loaded metadata for ' + key);
  }

  function readForm(){
    const key = document.getElementById('me-model-select').value;
    const rotation = { x: parseFloat(document.getElementById('me-rotx').value)||0, y: parseFloat(document.getElementById('me-roty').value)||0, z: parseFloat(document.getElementById('me-rotz').value)||0 };
    const meta = {
      rotation,
      rotationDegrees: !!document.getElementById('me-rotdeg').checked,
      preScale: parseFloat(document.getElementById('me-prescale').value)||1,
      offset: { x: parseFloat(document.getElementById('me-offx').value)||0, y: parseFloat(document.getElementById('me-offy').value)||0, z: parseFloat(document.getElementById('me-offz').value)||0 }
    };
    return { key, meta };
  }

  function setStatus(s){ document.getElementById('me-status').textContent = s; }

  function onApply(){
    const {key, meta} = readForm();
    if (!window.tycoon) return setStatus('tycoon not ready');
    window.tycoon.buildingModelMeta[key] = meta;
    setStatus('Applied metadata to ' + key + ' (runtime only)');
  }

  function onPreview(){
    const {key, meta} = readForm();
    if (!window.tycoon) return setStatus('tycoon not ready');
    // Find placed model instances for this building type and apply meta + auto-fit
    let found = false;
    for (const [k, obj] of window.tycoon.buildings.entries()){
      if (obj && obj.userData && obj.userData.type === key) {
        applyMetaToModel(obj, meta, window.tycoon.plotSize);
        found = true;
      }
    }
    if (!found) setStatus('No placed instance found for ' + key + ' to preview.');
    else setStatus('Preview applied to placed instances for ' + key);
  }

  function applyMetaToModel(model, meta, plotSize){
    try {
      if (meta.rotation){
        const toRad = v => (meta.rotationDegrees ? (v||0) * Math.PI/180 : (v||0));
        model.rotation.set(toRad(meta.rotation.x), toRad(meta.rotation.y), toRad(meta.rotation.z));
      }
      if (meta.preScale) model.scale.multiplyScalar(meta.preScale);
      if (meta.offset) model.position.add(new THREE.Vector3(meta.offset.x||0, meta.offset.y||0, meta.offset.z||0));

      // simple auto-fit similar to tycoon: scale to 80% of plot
      const bbox = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3(); bbox.getSize(size);
      const desired = plotSize * 0.8;
      const maxDim = Math.max(size.x, size.z, 0.0001);
      const s = desired / maxDim;
      model.scale.multiplyScalar(s);

      // recenter bottom to ground
      bbox.setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      const yOffset = -bbox.min.y;
      model.position.x += (model.position.x ? 0 : 0) + (0 - center.x);
      model.position.z += (model.position.z ? 0 : 0) + (0 - center.z);
      model.position.y += yOffset;
    } catch (e){
      console.warn('Preview apply failed', e);
    }
  }

  function onDownload(){
    const {key, meta} = readForm();
    // Build JSON format expected by generator: { buildingType, meta }
    const out = { buildingType: key, meta };
    const folder = folderForKey(key);
    const filename = folder ? `${folder}_meta.json` : `${key}_meta.json`;
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'meta.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setStatus('meta.json downloaded — move to your model folder and rename to meta.json');
  }

  function onCopy(){
    const {meta} = readForm();
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2)).then(()=>setStatus('Copied JSON to clipboard'));
  }

  function folderForKey(key){
    try {
      const map = window.tycoon.buildingModelMap || {};
      const path = map[key];
      if (!path) return null;
      // path like models/folder/scene.gltf
      const parts = path.split('/');
      if (parts.length >= 2) return parts[1];
      return null;
    } catch(e){ return null; }
  }

  // Initialize panel after tycoon ready
  waitForTycoon().then((tycoon)=>{
    createPanel();
    populateSelect(tycoon);
    setStatus('Ready — edit model metadata and preview');
  }).catch(()=>{
    console.warn('Model editor: tycoon not available');
  });

})();
