// game.js - 3D Tic Tac Toe with Three.js

let scene, camera, renderer;
let board = [];
let currentPlayer = "X";
let winner = null;

// Create scene, camera, and renderer
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    createBoard();
    animate();
}

// Create the Tic-Tac-Toe board
function createBoard() {
    const boardSize = 3;
    const spacing = 2;

    for (let row = 0; row < boardSize; row++) {
        board[row] = [];
        for (let col = 0; col < boardSize; col++) {
            let tile = new THREE.Mesh(
                new THREE.BoxGeometry(1.8, 0.2, 1.8),
                new THREE.MeshStandardMaterial({ color: 0x222222 })
            );

            tile.position.set(col * spacing - spacing, 0, row * spacing - spacing);
            tile.userData = { row, col, value: null };

            scene.add(tile);
            board[row][col] = tile;
        }
    }

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
}

// Handle mouse clicks
function onMouseClick(event) {
    if (winner) return;

    let mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        let tile = intersects[0].object;
        let { row, col } = tile.userData;

        if (!tile.userData.value) {
            tile.userData.value = currentPlayer;
            placeMarker(tile, currentPlayer);
            if (checkWin()) {
                alert(`${currentPlayer} Wins!`);
                winner = currentPlayer;
                return;
            }
            currentPlayer = currentPlayer === "X" ? "O" : "X";
        }
    }
}

// Place X or O markers
function placeMarker(tile, player) {
    let markerGeometry = new THREE.TorusGeometry(0.6, 0.2, 16, 32);
    let markerMaterial = new THREE.MeshStandardMaterial({ color: player === "X" ? 0xff0000 : 0x0000ff });

    let marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(tile.position.x, tile.position.y + 0.5, tile.position.z);
    marker.rotation.x = Math.PI / 2;

    scene.add(marker);
}

// Check for a win
function checkWin() {
    let boardState = board.map(row => row.map(tile => tile.userData.value || ""));
    let lines = [
        // Rows
        [boardState[0][0], boardState[0][1], boardState[0][2]],
        [boardState[1][0], boardState[1][1], boardState[1][2]],
        [boardState[2][0], boardState[2][1], boardState[2][2]],
        // Columns
        [boardState[0][0], boardState[1][0], boardState[2][0]],
        [boardState[0][1], boardState[1][1], boardState[2][1]],
        [boardState[0][2], boardState[1][2], boardState[2][2]],
        // Diagonals
        [boardState[0][0], boardState[1][1], boardState[2][2]],
        [boardState[0][2], boardState[1][1], boardState[2][0]]
    ];

    return lines.some(line => line.every(cell => cell && cell === line[0]));
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Event Listener
window.addEventListener("click", onMouseClick);

// Initialize Game
init();
