import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

(() => {
    const container = document.querySelector("#three-bg-container");
    if (!container || container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";

    const isInPages = window.location.pathname.includes("/pages/");
    const normalizeAssetPath = (value) => {
        if (!value) return value;
        if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) return value;
        const cleaned = value.replace(/^\.\//, "").replace(/^\.\.\//, "");
        const basePrefix = isInPages ? "../" : "./";
        return new URL(`${basePrefix}${cleaned}`, window.location.href).toString();
    };

    const modelUrl = normalizeAssetPath(container.dataset.ironGlb || "assets/blender/character/spiderman.glb");
    const videoUrl = normalizeAssetPath(container.dataset.bgVideo || "assets/videos/tripo-showcase.mp4");
    const modelBaseY = -1.5;

    const isSmallScreen = window.innerWidth <= 768;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const defaultSettings = { disable3dModels: false, disable3dAnimations: false };
    const settingsFromStorage = () => {
        try {
            const stored = JSON.parse(localStorage.getItem("fx-settings") || "{}");
            return { ...defaultSettings, ...stored };
        } catch {
            return { ...defaultSettings };
        }
    };
    const getTheme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark";
    const getFxSettings = () => typeof window.getFxSettings === "function" ? { ...defaultSettings, ...window.getFxSettings() } : settingsFromStorage();

    let scene;
    let camera;
    let renderer;
    let groundMaterial;
    let chestLight;
    let ironManModel;
    let rainPoints;
    let animationFrameId = 0;
    let isPaused = document.hidden;
    let modelsEnabled = !getFxSettings().disable3dModels;
    let animationsEnabled = !getFxSettings().disable3dAnimations && !prefersReducedMotion;
    let transitionFactor = 0;
    let contactFactor = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let videoPlane;
    let backgroundVideo;
    let backgroundVideoTexture;
    const animationClock = new THREE.Clock();
    const homeGroup = new THREE.Group();
    const scrollGroup = new THREE.Group();
    const contactGroup = new THREE.Group();
    const rainCount = isSmallScreen ? 120 : 300;
    const rainPositions = new Float32Array(rainCount * 3);
    const rainVelocities = new Float32Array(rainCount);

    try {
        scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 5, 60);
        camera = new THREE.PerspectiveCamera(65, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 200);
        camera.position.set(0, 0, 15);
        renderer = new THREE.WebGLRenderer({ antialias: !isSmallScreen, alpha: true, powerPreference: "high-performance", precision: "lowp" });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmallScreen ? 1 : 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 2.0;
        container.appendChild(renderer.domElement);

        scene.add(homeGroup, scrollGroup, contactGroup);
        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const mainLight = new THREE.DirectionalLight(0xffffff, 4);
        mainLight.position.set(5, 10, 7.5);
        scene.add(mainLight);
        chestLight = new THREE.PointLight(0x00f0ff, 20, 15);
        scrollGroup.add(chestLight);

        const groundGeometry = new THREE.PlaneGeometry(120, 120, 16, 16);
        groundMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.1, depthWrite: false });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -8;
        scrollGroup.add(groundMesh);

        for (let index = 0; index < rainCount; index += 1) {
            const offset = index * 3;
            rainPositions[offset] = (Math.random() - 0.5) * 60;
            rainPositions[offset + 1] = (Math.random() - 0.5) * 40 + 10;
            rainPositions[offset + 2] = (Math.random() - 0.5) * 60;
            rainVelocities[index] = 0.22 + Math.random() * 0.1;
        }
        const rainGeometry = new THREE.BufferGeometry();
        rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
        const rainMaterial = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.06, transparent: true, opacity: 0.6, depthWrite: false });
        rainPoints = new THREE.Points(rainGeometry, rainMaterial);
        scrollGroup.add(rainPoints);

        setThemeLighting(getTheme());
        loadIronMan();
        bindEvents();
        resize();
        if (!isPaused) animate();
    } catch (error) {
        console.error("Unable to initialize Three.js background:", error);
        disposeScene();
    }

    function setThemeLighting(theme) {
        if (!scene || !groundMaterial) return;
        const lightTheme = theme === "light";
        scene.fog = new THREE.Fog(lightTheme ? 0xf3f5fa : 0x000000, lightTheme ? 6 : 5, lightTheme ? 75 : 60);
        groundMaterial.color.set(lightTheme ? 0x0b1b4d : 0x00f0ff);
        groundMaterial.opacity = lightTheme ? 0.16 : 0.1;
        if (backgroundVideoTexture) {
            backgroundVideoTexture.colorSpace = THREE.SRGBColorSpace;
        }
    }

    function attachVideoFallback() {
        if (!videoUrl || videoPlane || !scene) return;
        const video = document.createElement("video");
        video.src = videoUrl;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        video.crossOrigin = "anonymous";
        video.setAttribute("playsinline", "true");
        backgroundVideo = video;

        backgroundVideoTexture = new THREE.VideoTexture(video);
        backgroundVideoTexture.colorSpace = THREE.SRGBColorSpace;
        backgroundVideoTexture.needsUpdate = true;

        const videoMaterial = new THREE.MeshBasicMaterial({
            map: backgroundVideoTexture,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const videoGeometry = new THREE.PlaneGeometry(32, 18);
        videoPlane = new THREE.Mesh(videoGeometry, videoMaterial);
        videoPlane.position.set(0, 0, -14);
        homeGroup.add(videoPlane);

        video.play().catch(() => {
            console.warn("Three.js video fallback could not autoplay; the page remains functional.");
        });
    }

    function loadIronMan() {
        if (!modelsEnabled) return;
        if (!modelUrl) {
            attachVideoFallback();
            return;
        }

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
        const modelLoader = new GLTFLoader();
        modelLoader.setDRACOLoader(dracoLoader);
        modelLoader.load(
            modelUrl,
            (gltf) => {
                if (!modelsEnabled || !scene) return;
                ironManModel = gltf.scene;
                const boundingBox = new THREE.Box3().setFromObject(ironManModel);
                const sizeVector = new THREE.Vector3();
                boundingBox.getSize(sizeVector);
                const maxDimension = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);
                if (maxDimension > 0) ironManModel.scale.setScalar(12 / maxDimension);
                ironManModel.position.set(0, modelBaseY, 0);
                homeGroup.add(ironManModel);
            },
            undefined,
            (error) => {
                console.error("Unable to load Spider-Man GLB model; using the video fallback instead.", error);
                attachVideoFallback();
            }
        );
    }

    function updateInputPosition(x, y) {
        targetRotationY = (x / window.innerWidth - 0.5) * 1.5;
        targetRotationX = (y / window.innerHeight - 0.5) * 0.8;
    }

    function setModelsEnabled(enabled) {
        modelsEnabled = enabled;
        if (!enabled && ironManModel) {
            homeGroup.remove(ironManModel);
            disposeObject(ironManModel);
            ironManModel = undefined;
        } else if (enabled && !ironManModel) {
            loadIronMan();
        }
    }

    function setAnimationsEnabled(enabled) {
        animationsEnabled = enabled && !prefersReducedMotion;
        if (rainPoints) rainPoints.visible = animationsEnabled;
    }

    function bindEvents() {
        window.addEventListener("pointermove", (event) => updateInputPosition(event.clientX, event.clientY), { passive: true });
        window.addEventListener("scroll", updateScrollState, { passive: true });
        window.addEventListener("themeChange", (event) => setThemeLighting(event.detail?.theme || getTheme()));
        window.addEventListener("fxSettingsChange", (event) => {
            const next = { ...getFxSettings(), ...(event.detail || {}) };
            setModelsEnabled(!next.disable3dModels);
            setAnimationsEnabled(!next.disable3dAnimations);
        });
        document.addEventListener("visibilitychange", () => {
            isPaused = document.hidden;
            if (isPaused) {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
                if (backgroundVideo) backgroundVideo.pause();
            } else if (!animationFrameId) {
                animationClock.start();
                if (backgroundVideo) backgroundVideo.play().catch(() => {});
                animate();
            }
        });
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
    }

    function updateScrollState() {
        const windowHeight = Math.max(window.innerHeight, 1);
        const currentScrollY = window.scrollY;
        const targetTransition = Math.min(currentScrollY / (windowHeight * 0.8), 1);
        const contactSection = document.querySelector("#contact");
        const contactProgress = contactSection ? (windowHeight - contactSection.getBoundingClientRect().top) / Math.max(contactSection.offsetHeight, windowHeight) : 0;
        contactFactor = THREE.MathUtils.clamp(contactProgress, 0, 1);
        transitionFactor += (targetTransition - transitionFactor) * 0.08;
    }

    function animate() {
        if (isPaused || !renderer) {
            animationFrameId = 0;
            return;
        }
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = animationClock.getElapsedTime();
        updateScrollState();
        if (isInPages) {
            homeGroup.position.y = 0;
            homeGroup.scale.setScalar(1);
            homeGroup.visible = true;
            scrollGroup.position.y = 0;
            scrollGroup.scale.setScalar(1);
            scrollGroup.visible = true;
            contactGroup.visible = false;
        } else {
            homeGroup.position.y = transitionFactor * 25;
            homeGroup.scale.setScalar(1 - transitionFactor);
            homeGroup.visible = transitionFactor < 0.98;
            scrollGroup.position.y = (1 - transitionFactor) * -25 + contactFactor * 25;
            scrollGroup.scale.setScalar(1 - contactFactor);
            scrollGroup.visible = transitionFactor > 0.02 && contactFactor < 0.98;
            contactGroup.visible = contactFactor >= 0.98;
        }

        if (animationsEnabled) {
            if (ironManModel) {
                ironManModel.position.y = modelBaseY + Math.sin(elapsedTime * 2.5) * 0.3;
                ironManModel.rotation.y += (targetRotationY - ironManModel.rotation.y) * 0.15;
                ironManModel.rotation.x += (targetRotationX - ironManModel.rotation.x) * 0.15;
            }
            const groundMesh = scrollGroup.children.find((child) => child.isMesh);
            if (groundMesh) groundMesh.position.z = Math.sin(elapsedTime * 0.5) * 2;
            const rainAttribute = rainPoints?.geometry.getAttribute("position");
            if (rainAttribute) {
                for (let index = 0; index < rainCount; index += 1) {
                    const offset = index * 3;
                    rainAttribute.array[offset + 1] -= rainVelocities[index];
                    if (rainAttribute.array[offset + 1] < -12) rainAttribute.array[offset + 1] = 30;
                }
                rainAttribute.needsUpdate = true;
            }
            if (chestLight) chestLight.intensity = (25 + Math.sin(elapsedTime * 5) * 10) * (1 - contactFactor) * (0.25 + transitionFactor * 0.75);
        }
        renderer.render(scene, camera);
    }

    function resize() {
        if (!renderer || !camera) return;
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        if (videoPlane) {
            const aspect = width / height;
            videoPlane.scale.set(18 * aspect, 10, 1);
            videoPlane.position.z = -14;
        }
    }

    function disposeObject(object) {
        object.traverse((node) => {
            if (!node.isMesh) return;
            node.geometry?.dispose();
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach((material) => material?.dispose());
        });
    }

    function disposeScene() {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (backgroundVideo) backgroundVideo.pause();
        if (backgroundVideoTexture) backgroundVideoTexture.dispose();
        if (renderer) renderer.dispose();
        if (ironManModel) disposeObject(ironManModel);
        if (videoPlane) {
            videoPlane.material.dispose();
            videoPlane.geometry.dispose();
        }
    }
})();
