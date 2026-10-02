<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#fbfcf8">
    <title>Fieldwork | Farm map</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div class="app-shell">
        <header class="topbar">
            <div class="brand-lockup">
                <div class="brand-mark" aria-hidden="true">f.</div>
                <div class="brand-copy">
                    <span class="brand-name">Fieldwork</span>
                    <span class="brand-caption">Farm management</span>
                </div>
            </div>

            <div class="topbar-actions">
                <div class="status-note"><span class="status-dot" aria-hidden="true"></span><span id="save-status">Saved on this device</span></div>
                <label class="farm-switcher-wrap" aria-label="Current farm">
                    <span class="farm-switcher-mark" aria-hidden="true">◆</span>
                    <select class="farm-switcher" id="farm-switcher" aria-label="Select farm"></select>
                </label>
                <button class="add-farm-button" id="add-farm" type="button" aria-label="Add farm" title="Add farm">+</button>
            </div>
        </header>

        <dialog class="farm-dialog" id="farm-dialog" aria-labelledby="farm-dialog-title">
            <form id="farm-form" class="farm-form">
                <div class="farm-dialog-heading">
                    <p class="eyebrow">Farm setup</p>
                    <h2 id="farm-dialog-title">Add a farm</h2>
                </div>
                <label class="farm-name-label" for="farm-name">Farm name</label>
                <input id="farm-name" name="name" type="text" maxlength="80" autocomplete="organization" required>
                <div class="farm-dialog-actions">
                    <button class="dialog-secondary" id="cancel-farm" type="button">Cancel</button>
                    <button class="dialog-primary" type="submit">Create farm</button>
                </div>
            </form>
        </dialog>

        <dialog class="farm-dialog building-dialog" id="building-dialog" aria-labelledby="building-dialog-title">
            <form id="building-form" class="farm-form">
                <div class="farm-dialog-heading">
                    <p class="eyebrow">Map placement</p>
                    <h2 id="building-dialog-title">Add a building</h2>
                </div>
                <label class="farm-name-label" for="building-kind">Building type</label>
                <select class="dialog-select" id="building-kind" name="building_type" required>
                    <option value="storage">Storage</option>
                    <option value="barn">Barn</option>
                    <option value="greenhouse">Greenhouse</option>
                    <option value="workshop">Workshop</option>
                    <option value="other">Other</option>
                </select>
                    <label class="farm-name-label" for="building-color">Pin color</label>
                    <input class="building-color building-dialog-color" id="building-color" name="color" type="color" value="#b66f39" aria-label="Building pin color">
                <div class="farm-dialog-actions">
                    <button class="dialog-secondary" id="cancel-building" type="button">Cancel</button>
                    <button class="dialog-primary" type="submit">Place building</button>
                </div>
            </form>
        </dialog>

        <main class="workspace">
            <aside class="sidebar" aria-label="Farm fields">
                <div class="sidebar-top">
                    <div class="sidebar-intro">
                        <p class="eyebrow">Field operations / Map</p>
                        <h1 class="page-title">Farm map</h1>
                    </div>

                    <div class="farm-summary" aria-label="Farm summary">
                        <div class="farm-metric">
                            <span class="metric-label">Fields</span>
                            <span class="metric-value" id="field-count">00</span>
                        </div>
                        <div class="farm-metric">
                            <span class="metric-label">Buildings</span>
                            <span class="metric-value" id="building-count">00</span>
                        </div>
                    </div>

                    <section class="field-section" aria-labelledby="fields-heading">
                        <div class="sidebar-heading">
                            <h2 id="fields-heading">Your fields</h2>
                            <span class="count-badge" id="field-count-mobile" aria-hidden="true">00</span>
                        </div>
                        <div class="field-list" id="field-list" aria-live="polite"></div>
                    </section>

                    <section class="field-details-section" id="field-details-panel" aria-live="polite">
                        <div class="field-details-header">
                            <p class="eyebrow">Field details</p>
                            <h3 id="field-details-name">Select a field</h3>
                        </div>
                        <dl class="field-detail-grid">
                            <div>
                                <dt>Crop</dt>
                                <dd id="field-detail-crop">—</dd>
                            </div>
                            <div>
                                <dt>Irrigation</dt>
                                <dd id="field-detail-irrigation">—</dd>
                            </div>
                            <div>
                                <dt>Soil type</dt>
                                <dd id="field-detail-soil">—</dd>
                            </div>
                            <div>
                                <dt>Last activity</dt>
                                <dd id="field-detail-activity">—</dd>
                            </div>
                            <div>
                                <dt>Manager</dt>
                                <dd id="field-detail-manager">—</dd>
                            </div>
                            <div class="field-detail-wide">
                                <dt>Area</dt>
                                <dd id="field-detail-area">—</dd>
                            </div>
                            <div class="field-detail-wide">
                                <dt>Soil fertility</dt>
                                <dd id="field-detail-fertility">—</dd>
                            </div>
                        </dl>
                    </section>

                    <section class="field-section building-section" aria-labelledby="buildings-heading">
                        <div class="sidebar-heading">
                            <h2 id="buildings-heading">Buildings</h2>
                            <span class="count-badge" id="building-count-mobile" aria-hidden="true">00</span>
                        </div>
                        <div class="field-list building-list" id="building-list" aria-live="polite"></div>
                    </section>
                </div>

                <div class="sidebar-bottom">
                    <span class="section-kicker">Local workspace</span>
                    <div class="local-note"><span aria-hidden="true">●</span><span>Field boundaries are stored <strong>only in this browser</strong> for now.</span></div>
                </div>
            </aside>

            <section class="map-stage" aria-label="Interactive field map">
                <div id="field-map" role="application" aria-label="Map. Use the draw tool to outline a field."></div>

                <div class="map-topline">
                    <div class="map-overline"><span class="status-dot" aria-hidden="true"></span>Field boundary map</div>
                    <div class="map-coordinates">OpenStreetMap</div>
                </div>

                <div class="map-control-stack" aria-label="Map tools">
                    <button class="map-action is-primary" id="draw-field" type="button">
                        <span class="action-glyph" aria-hidden="true">＋</span><span>Draw field</span>
                    </button>
                    <button class="map-action is-active" id="edit-fields" type="button" aria-pressed="true" title="Drag a field to move it, or drag its boundary points to reshape it">
                        <span class="action-glyph" aria-hidden="true">⌖</span><span>Move / reshape</span>
                    </button>
                    <button class="map-action" id="delete-selected" type="button" disabled>
                        <span class="action-glyph" aria-hidden="true">−</span><span>Delete selected</span>
                    </button>
                    <button class="map-action" id="locate-me" type="button">
                        <span class="action-glyph" aria-hidden="true">◎</span><span>My location</span>
                    </button>
                </div>

                <div class="map-hint" id="draw-hint" hidden>Tap or click around the field boundary. Select the first point to close the shape.</div>
                <div class="selection-chip" id="selection-label" aria-live="polite">Nothing selected</div>
                <div class="map-toast" id="map-toast" role="status" aria-live="polite"></div>
            </section>
        </main>
    </div>
</body>
</html>