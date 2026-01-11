(function () {
  const form         = document.getElementById('configForm');
  const btnTest      = document.getElementById('btnObjectStorageTest');
  const btnSave      = document.getElementById('btnSaveConfig');
  const btnReset     = document.getElementById('btnResetObjectStorage');
  const resultBox    = document.getElementById('objectStorageTestResult');
  const testPassedEl = document.getElementById('objectStorageTestPassed');
  const resetForm    = document.getElementById('resetObjectStorageForm');

  if (!form || !btnTest || !btnSave || !testPassedEl || !resultBox) return;

  function byName(name) {
    const cb = document.querySelector('input[type="checkbox"][name="' + name + '"]');
    if (cb) return cb;
    return document.querySelector('[name="' + name + '"]');
  }

  const elEnable    = byName('config_objectStorageEnable');
  const elEndpoint  = byName('config_objectStorageEndpoint');
  const elBucket    = byName('config_objectStorageBucket');
  const elAK        = byName('config_objectStorageAccessKey');
  const elSK        = byName('config_objectStorageSecretKey');
  const elRegion    = byName('config_objectStorageRegion');
  const elPrefix    = byName('config_objectStoragePrefix');
  const elPathStyle = byName('config_objectStoragePathStyle');
  const elVerifySSL = byName('config_objectStorageVerifySSL');

  function isEnabledChecked() {
    return !!(elEnable && elEnable.checked);
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showResult(ok, msg) {
    resultBox.style.display = 'block';
    resultBox.className = 'alert ' + (ok ? 'alert-success' : 'alert-danger');
    resultBox.textContent = msg;
    scrollTop();
  }

  function hideResult() {
    resultBox.style.display = 'none';
    resultBox.className = '';
    resultBox.textContent = '';
  }

  function setTestPassed(ok) {
    testPassedEl.value = ok ? "1" : "0";
  }

  function norm(v) {
    return String(v == null ? '' : v).trim();
  }

  function checkboxVal(el) {
    if (!el) return "0";
    return el.checked ? "1" : "0";
  }

  function connectionFingerprint() {
    return [
      norm(elEndpoint && elEndpoint.value),
      norm(elBucket && elBucket.value),
      norm(elAK && elAK.value),
      norm(elSK && elSK.value),
      norm(elRegion && elRegion.value),
      norm(elPrefix && elPrefix.value),
      checkboxVal(elPathStyle),
      checkboxVal(elVerifySSL),
    ].join('|');
  }

  const initialEnabled = isEnabledChecked();
  const initialFp = connectionFingerprint();

  function connectionChanged() {
    return connectionFingerprint() !== initialFp;
  }

  function enablingNow() {
    return !initialEnabled && isEnabledChecked();
  }

  function applySaveGate() {
    if (!isEnabledChecked()) {
      btnSave.disabled = false;
      return;
    }

    const needsTest = enablingNow() || connectionChanged();
    if (!needsTest) {
      btnSave.disabled = false;
      return;
    }

    btnSave.disabled = (testPassedEl.value !== "1");
  }

  function resetTestStateUi() {
    setTestPassed(false);
    applySaveGate();
    hideResult();
  }

  function missingRequiredFields() {
    if (!isEnabledChecked()) return [];

    const missing = [];
    if (!elEndpoint || !norm(elEndpoint.value)) missing.push('Endpoint');
    if (!elBucket   || !norm(elBucket.value))   missing.push('Bucket');
    if (!elAK       || !norm(elAK.value))       missing.push('Access Key ID');
    if (!elSK       || !norm(elSK.value))       missing.push('Secret Access Key');
    if (!elRegion   || !norm(elRegion.value))   missing.push('Region');
    return missing;
  }

  applySaveGate();

  const invalidateEls = [elEndpoint, elBucket, elAK, elSK, elRegion, elPrefix, elPathStyle, elVerifySSL];
  invalidateEls.forEach(function (el) {
    if (!el) return;
    el.addEventListener('change', function () {
      if (isEnabledChecked()) resetTestStateUi();
      else applySaveGate();
    });
    el.addEventListener('input', function () {
      if (isEnabledChecked()) resetTestStateUi();
    });
  });

  if (elEnable) {
    elEnable.addEventListener('change', function () {
      if (isEnabledChecked()) {
        if (enablingNow() || connectionChanged()) resetTestStateUi();
      } else {
        setTestPassed(false);
        applySaveGate();
        hideResult();
      }
    });
  }

  btnTest.addEventListener('click', function () {
    const missing = missingRequiredFields();
    if (missing.length > 0) {
      setTestPassed(false);
      applySaveGate();
      showResult(false, 'Missing required fields: ' + missing.join(', ') + '.');
      return;
    }

    const fd = new FormData(form);
    fd.set('action', 'testObjectStorage');

    btnTest.disabled = true;
    showResult(false, 'Running object storage test…');

    fetch(window.location.href, {
      method: 'POST',
      body: fd,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin'
    })
    .then(function (r) {
      return r.json().catch(function () {
        return Promise.reject(new Error('Server returned a non-JSON response (HTTP ' + r.status + ').'));
      });
    })
    .then(function (j) {
      btnTest.disabled = false;

      if (!j || typeof j.ok === 'undefined') {
        setTestPassed(false);
        applySaveGate();
        showResult(false, 'Unexpected response from server.');
        return;
      }

      if (j.ok && j.skipped) {
        setTestPassed(false);
        applySaveGate();
        showResult(false, 'Test skipped: Object Storage is disabled.');
        return;
      }

      if (j.ok) {
        setTestPassed(true);
        applySaveGate();
        showResult(true, 'Test passed. Write permissions confirmed.');
      } else {
        setTestPassed(false);
        applySaveGate();
        showResult(false, (j.error ? String(j.error) : 'Test failed.'));
      }
    })
    .catch(function (err) {
      btnTest.disabled = false;
      setTestPassed(false);
      applySaveGate();
      showResult(false, 'Request failed: ' + (err && err.message ? err.message : String(err)));
    });
  });

  form.addEventListener('submit', function (e) {
    if (!isEnabledChecked()) return;

    const needsTest = enablingNow() || connectionChanged();
    if (!needsTest) return;

    const missing = missingRequiredFields();
    if (missing.length > 0) {
      e.preventDefault();
      setTestPassed(false);
      applySaveGate();
      showResult(false, 'Missing required fields: ' + missing.join(', ') + '.');
      return;
    }

    if (testPassedEl.value !== "1") {
      e.preventDefault();
      applySaveGate();
      showResult(false, 'Object storage test must pass before saving.');
    } else {
      scrollTop();
    }
  });

  if (btnReset && resetForm) {
    btnReset.addEventListener('click', function () {
      const ok = confirm(
        "Reset Object Storage configuration?\n\n" +
        "This clears only Object Storage settings.\n\n" +
        "This cannot be undone."
      );
      if (!ok) return;

      resetTestStateUi();
      resetForm.submit();
      scrollTop();
    });
  }
})();
