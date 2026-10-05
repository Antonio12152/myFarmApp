import * as L from 'leaflet';
import {
	TerraDraw,
	TerraDrawMarkerMode,
	TerraDrawPolygonMode,
	TerraDrawSelectMode,
} from 'terra-draw';
import { TerraDrawLeafletAdapter } from 'terra-draw-leaflet-adapter';
import { cropDatabase } from './crops';

const mapElement = document.getElementById('field-map');

if (mapElement) {
	const workspaceStorageKey = 'myfarm.workspace.v2';
	const legacyFieldsStorageKey = 'myfarm.field-boundaries.v1';
	const defaultBuildingColor = '#b66f39';
	const buildingMarkerCache = new Map();
	const map = L.map(mapElement, { zoomControl: false }).setView([51.179026, -1.826252], 15);
	map.doubleClickZoom.disable();

	function normalizeBuildingColor(color) {
		return typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)
			? color
			: defaultBuildingColor;
	}

	function getBuildingMarkerUrl(feature) {
		const color = normalizeBuildingColor(feature.properties.color);
		if (buildingMarkerCache.has(color)) {
			return buildingMarkerCache.get(color);
		}

		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 88;
		const context = canvas.getContext('2d');
		if (!context) {
			return '';
		}

		context.scale(2, 2);
		context.beginPath();
		context.moveTo(15, 42);
		context.bezierCurveTo(12, 34, 2, 24, 2, 15);
		context.arc(15, 15, 13, Math.PI, 0, false);
		context.bezierCurveTo(28, 24, 18, 34, 15, 42);
		context.closePath();
		context.shadowColor = '#17271c55';
		context.shadowBlur = 3;
		context.shadowOffsetY = 1;
		context.fillStyle = color;
		context.fill();
		context.shadowColor = 'transparent';
		context.beginPath();
		context.arc(15, 15, 6, 0, Math.PI * 2);
		context.fillStyle = '#ffffff';
		context.fill();
		context.beginPath();
		context.arc(15, 15, 3, 0, Math.PI * 2);
		context.fillStyle = color;
		context.fill();

		const markerUrl = canvas.toDataURL('image/png');
		buildingMarkerCache.set(color, markerUrl);
		return markerUrl;
	}

	L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		maxZoom: 19,
	}).addTo(map);

	L.control.zoom({ position: 'bottomright' }).addTo(map);

	const draw = new TerraDraw({
		adapter: new TerraDrawLeafletAdapter({ lib: L, map }),
		modes: [
			new TerraDrawPolygonMode({
				modeName: 'field',
				styles: {
					fillColor: '#6f8f52',
					fillOpacity: 0.25,
					outlineColor: '#365d43',
					outlineWidth: 3,
					closingPointColor: '#f4bf51',
					closingPointOutlineColor: '#ffffff',
					closingPointOutlineWidth: 2,
					coordinatePointColor: '#f4bf51',
					coordinatePointOutlineColor: '#ffffff',
					coordinatePointOutlineWidth: 2,
				},
			}),
			new TerraDrawMarkerMode({
				modeName: 'building',
				styles: {
					markerUrl: getBuildingMarkerUrl,
					markerWidth: 32,
					markerHeight: 44,
				},
			}),
			new TerraDrawSelectMode({
				styles: {
					selectedMarkerUrl: getBuildingMarkerUrl,
					selectedMarkerWidth: 32,
					selectedMarkerHeight: 44,
				},
				flags: {
					field: {
						feature: {
							draggable: true,
							coordinates: {
								midpoints: true,
								draggable: true,
								deletable: true,
							},
						},
					},
					building: { feature: { draggable: true } },
				},
			}),
		],
	});

	draw.start();

	const fieldList = document.getElementById('field-list');
	const buildingList = document.getElementById('building-list');
	const fieldDetailsPanel = document.getElementById('field-details-panel');
	const fieldDetailsName = document.getElementById('field-details-name');
	const fieldDetailCrop = document.getElementById('field-detail-crop');
	const fieldDetailIrrigation = document.getElementById('field-detail-irrigation');
	const fieldDetailSoil = document.getElementById('field-detail-soil');
	const fieldDetailActivity = document.getElementById('field-detail-activity');
	const fieldDetailManager = document.getElementById('field-detail-manager');
	const fieldDetailArea = document.getElementById('field-detail-area');
	const fieldDetailNote = document.getElementById('field-detail-note');
	const fieldDetailProjectedProfit = document.getElementById('field-detail-projected-profit');
	const fieldDetailCropPlan = document.getElementById('field-detail-crop-plan');
	const fieldDetailFertility = document.getElementById('field-detail-fertility');
	const fieldCount = document.getElementById('field-count');
	const mobileFieldCount = document.getElementById('field-count-mobile');
	const buildingCount = document.getElementById('building-count');
	const mobileBuildingCount = document.getElementById('building-count-mobile');
	const selectionLabel = document.getElementById('selection-label');
	const deleteButton = document.getElementById('delete-selected');
	const drawButton = document.getElementById('draw-field');
	const editButton = document.getElementById('edit-fields');
	const buildingKind = document.getElementById('building-kind');
	const buildingColor = document.getElementById('building-color');
	const buildingDialog = document.getElementById('building-dialog');
	const buildingForm = document.getElementById('building-form');
	const farmSwitcher = document.getElementById('farm-switcher');
	const farmDialog = document.getElementById('farm-dialog');
	const farmForm = document.getElementById('farm-form');
	const farmNameInput = document.getElementById('farm-name');
	const drawHint = document.getElementById('draw-hint');
	const toast = document.getElementById('map-toast');
	const createId = () => globalThis.crypto?.randomUUID?.() ?? `farm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	const buildingLabels = {
		storage: 'Storage',
		barn: 'Barn',
		greenhouse: 'Greenhouse',
		workshop: 'Workshop',
		other: 'Building',
	};
	const fieldStaticProfiles = [
		{
			crop: 'Winter wheat',
			irrigation: 'Drip irrigation',
			soilType: 'Loamy silt',
			activity: 'Fertility check',
			manager: 'North block team',
			note: 'Strong moisture retention and steady yield projection.',
		},
		{
			crop: 'Barley',
			irrigation: 'Rain-fed',
			soilType: 'Clay loam',
			activity: 'Soil sampling',
			manager: 'West field crew',
			note: 'Stable structure with excellent nutrient retention.',
		},
		{
			crop: 'Oilseed rape',
			irrigation: 'Pivot irrigation',
			soilType: 'Sandy loam',
			activity: 'Crop scouting',
			manager: 'South block crew',
			note: 'Good drainage and fast warming for early emergence.',
		},
		{
			crop: 'Grass ley',
			irrigation: 'Sprinkler lines',
			soilType: 'Peaty loam',
			activity: 'Rotational grazing',
			manager: 'River field crew',
			note: 'High organic matter and resilient pasture cover.',
		},
	];
	let workspace = loadWorkspace();
	let activeFarmId = workspace.activeFarmId;
	let selectedId = null;
	let isRestoringFarm = false;
	let isDrawingField = false;
	let pendingBuildingCoordinates = null;
	let toastTimeout;

	function makeFarm(name) {
		return { id: createId(), name, fields: [], buildings: [] };
	}

	function normalizeBuildingFeature(feature) {
		if (feature.geometry?.type !== 'Polygon') {
			return {
				...feature,
				properties: {
					...feature.properties,
					mode: 'building',
					marker: true,
					color: normalizeBuildingColor(feature.properties.color),
				},
			};
		}

		const ring = feature.geometry.coordinates[0] ?? [];
		const points = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1]
			? ring.slice(0, -1)
			: ring;
		if (points.length === 0) {
			return null;
		}

		const center = points.reduce(
			(total, coordinate) => [total[0] + coordinate[0], total[1] + coordinate[1]],
			[0, 0],
		);

		return {
			...feature,
			geometry: {
				type: 'Point',
				coordinates: [
					Number((center[0] / points.length).toFixed(8)),
					Number((center[1] / points.length).toFixed(8)),
				],
			},
			properties: {
				...feature.properties,
				mode: 'building',
				marker: true,
				color: normalizeBuildingColor(feature.properties.color),
			},
		};
	}

	function loadWorkspace() {
		try {
			const savedWorkspace = JSON.parse(window.localStorage.getItem(workspaceStorageKey) ?? 'null');
			if (Array.isArray(savedWorkspace?.farms) && savedWorkspace.farms.length > 0) {
				const farms = savedWorkspace.farms.map((farm) => ({
					...farm,
					fields: Array.isArray(farm.fields) ? farm.fields : [],
					buildings: Array.isArray(farm.buildings)
						? farm.buildings.map(normalizeBuildingFeature).filter(Boolean)
						: [],
				}));
				const activeFarmId = farms.some((farm) => farm.id === savedWorkspace.activeFarmId)
					? savedWorkspace.activeFarmId
					: farms[0].id;

				return { farms, activeFarmId };
			}
		} catch {
			showToast('Saved farm data could not be loaded.');
		}

		const farm = makeFarm('My farm');
		try {
			const legacyFields = JSON.parse(window.localStorage.getItem(legacyFieldsStorageKey) ?? '[]');
			if (Array.isArray(legacyFields)) {
				farm.fields = legacyFields.map((feature) => ({
					...feature,
					properties: { ...feature.properties, mode: 'field' },
				}));
			}
		} catch {
			showToast('Older field data could not be imported.');
		}

		return { farms: [farm], activeFarmId: farm.id };
	}

	function getActiveFarm() {
		return workspace.farms.find((farm) => farm.id === activeFarmId);
	}

	function getFeatures() {
		return draw.getSnapshot().filter((feature) =>
			['field', 'building'].includes(feature.properties.mode)
			&& !feature.properties.midPoint
			&& !feature.properties.selectionPoint,
		);
	}

	function getFields() {
		return getFeatures().filter((feature) => feature.properties.mode === 'field');
	}

	function getBuildings() {
		return getFeatures().filter((feature) => feature.properties.mode === 'building');
	}

	function hashString(value) {
		return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
	}

	function getFieldStaticProfile(fieldName) {
		const fallback = fieldStaticProfiles[0];
		const name = fieldName ?? 'Field';
		const profile = fieldStaticProfiles[hashString(name) % fieldStaticProfiles.length] ?? fallback;

		return {
			crop: profile.crop,
			irrigation: profile.irrigation,
			soilType: profile.soilType,
			activity: profile.activity,
			manager: profile.manager,
			note: profile.note,
		};
	}

	function getFieldCropPlan(fieldName, feature) {
		const soilType = getFieldStaticProfile(fieldName).soilType;
		const areaHectares = getPolygonAreaSquareMeters(feature) / 10000;
		const rankedCrops = [...cropDatabase]
			.map((crop) => {
				const soilMatch = crop.soilSuitability.includes(soilType) ? 1 : 0.7;
				const irrigationFit = crop.waterNeed === 'Low' && getFieldStaticProfile(fieldName).irrigation === 'Drip irrigation'
					? 1.08
					: crop.waterNeed === 'Medium' ? 1.02 : 0.96;
				const score = (crop.profitability * soilMatch * irrigationFit) + (crop.marketDemand === 'High' ? 8 : 0);
				const projectedRevenue = areaHectares * crop.yieldTonnesPerHa * crop.pricePerTonne;
				const projectedCost = areaHectares * crop.variableCostPerHa;
				const projectedProfit = projectedRevenue - projectedCost;

				return {
					...crop,
					score,
					projectedRevenue,
					projectedCost,
					projectedProfit,
				};
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);

		const bestCrop = rankedCrops[0] ?? cropDatabase[0];
		const record = {
			selectedCrop: bestCrop.name,
			projectedProfit: bestCrop.projectedProfit,
			cropSummary: rankedCrops
				.map((crop) => `${crop.name} (${Math.round(crop.score)}%)`)
				.join(' • '),
		};

		return record;
	}

	function getPolygonAreaSquareMeters(feature) {
		if (feature.geometry?.type !== 'Polygon') {
			return 0;
		}

		const coordinates = feature.geometry.coordinates[0] ?? [];
		if (coordinates.length < 3) {
			return 0;
		}

		const polygon = L.polygon(coordinates.map(([lng, lat]) => [lat, lng]));
		return polygon.getArea();
	}

	function getFieldAreaDescription(feature) {
		const area = getPolygonAreaSquareMeters(feature);
		if (!area) {
			return '—';
		}

		const hectares = area / 10000;
		if (hectares < 0.1) {
			return `${Math.round(area)} m²`;
		}

		return `${hectares.toFixed(2)} ha`;
	}

	function getFieldFertilityScore(feature) {
		const area = getPolygonAreaSquareMeters(feature);
		if (!area) {
			return '—';
		}

		const coordinates = feature.geometry.coordinates[0] ?? [];
		if (coordinates.length === 0) {
			return '—';
		}

		const center = coordinates.reduce(
			(total, coordinate) => [total[0] + coordinate[0], total[1] + coordinate[1]],
			[0, 0],
		);
		const lat = center[1] / coordinates.length;
		const lng = center[0] / coordinates.length;
		const base = 54 + Math.abs(Math.sin((lat + lng) * 22)) * 24 + Math.min(area / 350000, 16);

		return `${Math.max(52, Math.min(98, Math.round(base)))}%`;
	}

	function showToast(message) {
		toast.textContent = message;
		toast.classList.add('is-visible');
		window.clearTimeout(toastTimeout);
		toastTimeout = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
	}

	function renderFieldDetails() {
		const selectedField = getFeatures().find((feature) => feature.id === selectedId && feature.properties.mode === 'field');
		if (!selectedField) {
			fieldDetailsPanel.classList.remove('is-visible');
			fieldDetailsName.textContent = 'Select a field';
			fieldDetailCrop.textContent = '—';
			fieldDetailIrrigation.textContent = '—';
			fieldDetailSoil.textContent = '—';
			fieldDetailActivity.textContent = '—';
			fieldDetailManager.textContent = '—';
			fieldDetailArea.textContent = '—';
			fieldDetailNote.textContent = '—';
			fieldDetailProjectedProfit.textContent = '—';
			fieldDetailCropPlan.textContent = '—';
			fieldDetailFertility.textContent = '—';
			return;
		}

		const staticProfile = getFieldStaticProfile(selectedField.properties.name);
		const cropPlan = getFieldCropPlan(selectedField.properties.name, selectedField);
		fieldDetailsPanel.classList.add('is-visible');
		fieldDetailsName.textContent = selectedField.properties.name || 'Field';
		fieldDetailCrop.textContent = staticProfile.crop;
		fieldDetailIrrigation.textContent = staticProfile.irrigation;
		fieldDetailSoil.textContent = staticProfile.soilType;
		fieldDetailActivity.textContent = staticProfile.activity;
		fieldDetailManager.textContent = staticProfile.manager;
		fieldDetailArea.textContent = getFieldAreaDescription(selectedField);
		fieldDetailNote.textContent = staticProfile.note;
		fieldDetailProjectedProfit.textContent = `€${Math.round(cropPlan.projectedProfit).toLocaleString()} / season`;
		fieldDetailCropPlan.textContent = `${cropPlan.selectedCrop} · ${cropPlan.cropSummary}`;
		fieldDetailFertility.textContent = getFieldFertilityScore(selectedField);
	}

	function saveWorkspace() {
		try {
			window.localStorage.setItem(workspaceStorageKey, JSON.stringify({
				farms: workspace.farms,
				activeFarmId,
			}));
			document.getElementById('save-status').textContent = 'Saved on this device';
		} catch {
			document.getElementById('save-status').textContent = 'Could not save locally';
			showToast('Browser storage is unavailable. Changes will not persist after refresh.');
		}
	}

	function getCleanFeatures(features) {
		return features.map((feature) => ({
			...feature,
			properties: { ...feature.properties, selected: false },
		}));
	}

	function saveActiveFarmFeatures() {
		const farm = getActiveFarm();
		if (!farm) {
			return;
		}

		const features = getCleanFeatures(getFeatures());
		farm.fields = features.filter((feature) => feature.properties.mode === 'field');
		farm.buildings = features.filter((feature) => feature.properties.mode === 'building');
		saveWorkspace();
	}

	function selectFeature(feature) {
		if (feature.properties.mode === 'building') {
			buildingColor.value = normalizeBuildingColor(feature.properties.color);
		}
		selectedId = feature.id;
		draw.setMode('select');
		activateTool('select');
		draw.selectFeature(feature.id);
		const bounds = L.geoJSON(feature).getBounds();
		if (bounds.isValid()) {
			map.fitBounds(bounds, { padding: [72, 72], maxZoom: 18 });
		}
		renderLists();
	}

	function renderFeatureList(features, listElement, emptyText, numberingLabel) {
		listElement.replaceChildren();

		if (features.length === 0) {
			const emptyState = document.createElement('p');
			emptyState.className = 'field-empty';
			emptyState.textContent = emptyText;
			listElement.append(emptyState);
		}

		features.forEach((feature, index) => {
			const fieldButton = document.createElement('button');
			const isSelected = feature.id === selectedId;
			fieldButton.type = 'button';
			const itemClass = feature.properties.mode === 'building' ? 'building-row' : 'field-row';
			fieldButton.className = `${itemClass}${isSelected ? ' is-selected' : ''}`;
			fieldButton.setAttribute('aria-pressed', String(isSelected));

			const marker = document.createElement('span');
			marker.className = `field-marker${feature.properties.mode === 'building' ? ' building-marker' : ''}`;
			marker.setAttribute('aria-hidden', 'true');
			if (feature.properties.mode === 'building') {
				marker.style.backgroundColor = normalizeBuildingColor(feature.properties.color);
			}

			const details = document.createElement('span');
			details.className = 'field-row-copy';

			const name = document.createElement('span');
			name.className = 'field-row-name';
			name.textContent = feature.properties.name || `${numberingLabel} ${String(index + 1).padStart(2, '0')}`;

			const subtitle = document.createElement('span');
			subtitle.className = 'field-row-meta';
			const vertexCount = feature.geometry.coordinates[0]?.length ?? 0;
			subtitle.textContent = feature.properties.mode === 'building'
				? buildingLabels[feature.properties.buildingType] ?? 'Building'
				: `${Math.max(vertexCount - 1, 0)} boundary points`;

			details.append(name, subtitle);

			const number = document.createElement('span');
			number.className = 'field-row-number';
			number.textContent = String(index + 1).padStart(2, '0');

			fieldButton.append(marker, details, number);
			fieldButton.addEventListener('click', () => selectFeature(feature));
			listElement.append(fieldButton);
		});
	}

	function renderFarmSwitcher() {
		farmSwitcher.replaceChildren();
		workspace.farms.forEach((farm) => {
			const option = document.createElement('option');
			option.value = farm.id;
			option.textContent = farm.name;
			farmSwitcher.append(option);
		});
		farmSwitcher.value = activeFarmId;
	}

	function renderLists() {
		const fields = getFields();
		const buildings = getBuildings();
		const formattedFieldCount = String(fields.length).padStart(2, '0');
		fieldCount.textContent = formattedFieldCount;
		mobileFieldCount.textContent = formattedFieldCount;
		const formattedBuildingCount = String(buildings.length).padStart(2, '0');
		buildingCount.textContent = formattedBuildingCount;
		mobileBuildingCount.textContent = formattedBuildingCount;
		renderFeatureList(fields, fieldList, 'No fields in this farm yet.', 'Field');
		renderFeatureList(buildings, buildingList, 'No buildings mapped yet.', 'Building');
		selectionLabel.textContent = selectedId ? '1 selected' : 'Nothing selected';
		deleteButton.disabled = !selectedId;
		renderFieldDetails();
	}

	function persistAndRender() {
		if (!isRestoringFarm) {
			saveActiveFarmFeatures();
		}
		renderLists();
	}

	function activateTool(mode) {
		const isDrawingField = mode === 'field';
		const isEditing = mode === 'select';
		drawButton.classList.toggle('is-primary', isDrawingField);
		drawButton.setAttribute('aria-pressed', String(isDrawingField));
		editButton.classList.toggle('is-active', isEditing);
		editButton.setAttribute('aria-pressed', String(isEditing));
	}

	function activateFarm(farmId) {
		isDrawingField = false;
		pendingBuildingCoordinates = null;
		buildingDialog.close();
		const previousFarm = getActiveFarm();
		if (previousFarm) {
			const features = getCleanFeatures(getFeatures());
			previousFarm.fields = features.filter((feature) => feature.properties.mode === 'field');
			previousFarm.buildings = features.filter((feature) => feature.properties.mode === 'building');
		}

		activeFarmId = farmId;
		workspace.activeFarmId = farmId;
		selectedId = null;
		isRestoringFarm = true;
		draw.clear();
		const farm = getActiveFarm();
		draw.addFeatures([
			...(farm?.fields ?? []).map((feature) => ({
				...feature,
				properties: { ...feature.properties, mode: 'field' },
			})),
			...(farm?.buildings ?? []).map(normalizeBuildingFeature).filter(Boolean),
		]);
		isRestoringFarm = false;
		renderFarmSwitcher();
		activateTool('select');
		draw.setMode('select');
		renderLists();
		saveWorkspace();
		renderFieldDetails();

		const bounds = L.geoJSON({ type: 'FeatureCollection', features: getFeatures() }).getBounds();
		if (bounds.isValid()) {
			map.fitBounds(bounds, { padding: [72, 72], maxZoom: 17 });
		}
	}

	draw.on('finish', (id, context) => {
		if (context.action === 'draw') {
			isDrawingField = false;
			const itemLabel = 'Field';
			const existingFeatures = getFields();
			let itemNumber = 1;
			while (existingFeatures.some((feature) => feature.properties.name === `${itemLabel} ${String(itemNumber).padStart(2, '0')}`)) {
				itemNumber += 1;
			}
			draw.updateFeatureProperties(id, {
				name: `${itemLabel} ${String(itemNumber).padStart(2, '0')}`,
			});
			draw.setMode('select');
			selectedId = id;
			draw.selectFeature(id);
			drawHint.hidden = true;
			showToast(`${itemLabel} added to ${getActiveFarm().name}.`);
		}
		persistAndRender();
		activateTool('select');
	});

	draw.on('change', () => {
		if (!isRestoringFarm) {
			persistAndRender();
		}
	});

	draw.on('select', (id) => {
		selectedId = id;
		const selectedFeature = draw.getSnapshotFeature(id);
		if (selectedFeature?.properties.mode === 'building') {
			buildingColor.value = normalizeBuildingColor(selectedFeature.properties.color);
		}
		activateTool('select');
		renderLists();
	});

	draw.on('deselect', () => {
		selectedId = null;
		renderLists();
		activateTool('select');
	});

	drawButton.addEventListener('click', () => {
		isDrawingField = true;
		selectedId = null;
		draw.setMode('field');
		activateTool('field');
		drawHint.textContent = 'Tap or click around the field boundary. Select the first point to close the shape.';
		drawHint.hidden = false;
		renderLists();
	});

	editButton.addEventListener('click', () => {
		isDrawingField = false;
		selectedId = null;
		draw.setMode('select');
		drawHint.hidden = true;
		renderLists();
		activateTool('select');
	});

	map.on('dblclick', (event) => {
		if (isDrawingField || buildingDialog.open) {
			return;
		}

		pendingBuildingCoordinates = [
			Number(event.latlng.lng.toFixed(8)),
			Number(event.latlng.lat.toFixed(8)),
		];
		buildingKind.value = 'storage';
		buildingDialog.showModal();
	});

	document.getElementById('cancel-building').addEventListener('click', () => {
		pendingBuildingCoordinates = null;
		buildingDialog.close();
	});

	buildingDialog.addEventListener('cancel', () => {
		pendingBuildingCoordinates = null;
	});

	buildingForm.addEventListener('submit', (event) => {
		event.preventDefault();
		if (!pendingBuildingCoordinates) {
			buildingDialog.close();
			return;
		}

		const buildingType = buildingKind.value;
		const label = buildingLabels[buildingType] ?? 'Building';
		const existingNames = new Set(
			getBuildings()
				.filter((feature) => feature.properties.buildingType === buildingType)
				.map((feature) => feature.properties.name),
		);
		let itemNumber = 1;
		while (existingNames.has(`${label} ${String(itemNumber).padStart(2, '0')}`)) {
			itemNumber += 1;
		}
		const result = draw.addFeatures([{
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: pendingBuildingCoordinates,
			},
			properties: {
				mode: 'building',
				marker: true,
				buildingType,
				color: normalizeBuildingColor(buildingColor.value),
				name: `${label} ${String(itemNumber).padStart(2, '0')}`,
			},
		}])[0];

		if (!result?.valid) {
			showToast(result?.reason ?? 'Could not place this building.');
			pendingBuildingCoordinates = null;
			buildingDialog.close();
			return;
		}

		selectedId = result.id;
		pendingBuildingCoordinates = null;
		buildingDialog.close();
		draw.setMode('select');
		activateTool('select');
		draw.selectFeature(result.id);
		persistAndRender();
		showToast(`${label} placed on ${getActiveFarm().name}.`);
	});

	buildingColor.addEventListener('input', () => {
		const building = getBuildings().find((feature) => feature.id === selectedId);
		if (!building) {
			return;
		}

		draw.updateFeatureProperties(selectedId, {
			color: normalizeBuildingColor(buildingColor.value),
		});
		persistAndRender();
	});

	deleteButton.addEventListener('click', () => {
		if (!selectedId) {
			return;
		}

		draw.removeFeatures([selectedId]);
		selectedId = null;
		persistAndRender();
		showToast('Map item removed.');
	});

	farmSwitcher.addEventListener('change', () => activateFarm(farmSwitcher.value));

	document.getElementById('add-farm').addEventListener('click', () => {
		farmNameInput.value = '';
		farmDialog.showModal();
		farmNameInput.focus();
	});

	document.getElementById('cancel-farm').addEventListener('click', () => farmDialog.close());

	farmForm.addEventListener('submit', (event) => {
		event.preventDefault();
		const name = farmNameInput.value.trim();
		if (!name) {
			farmNameInput.focus();
			return;
		}

		const farm = makeFarm(name);
		workspace.farms.push(farm);
		activateFarm(farm.id);
		farmDialog.close();
		showToast(`${farm.name} added.`);
	});

	document.getElementById('locate-me').addEventListener('click', () => {
		if (!navigator.geolocation) {
			showToast('Location is not available in this browser.');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			({ coords }) => map.flyTo([coords.latitude, coords.longitude], 16),
			() => showToast('Allow location access to center the map on your farm.'),
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	});

	renderFarmSwitcher();
	const activeFarm = getActiveFarm();
	isRestoringFarm = true;
	draw.addFeatures([
		...(activeFarm?.fields ?? []).map((feature) => ({
			...feature,
			properties: { ...feature.properties, mode: 'field' },
		})),
		...(activeFarm?.buildings ?? []).map(normalizeBuildingFeature).filter(Boolean),
	]);
	isRestoringFarm = false;
	draw.setMode('select');
	activateTool('select');
	renderLists();
	saveWorkspace();
	window.setTimeout(() => map.invalidateSize(), 0);
}
//
