const IMAGE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYg0r2RVnmUF1c3i5T4PxvKghTZ_s7oqJdNm69lWJAVzC6hfqmK8xpGwcOaMSTWbgMoC-_UavmdMK3/pub?gid=1925889595&single=true&output=csv';
const RECT_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQYg0r2RVnmUF1c3i5T4PxvKghTZ_s7oqJdNm69lWJAVzC6hfqmK8xpGwcOaMSTWbgMoC-_UavmdMK3/pub?gid=0&single=true&output=csv';

const MAP_WIDTH = 9000;
const MAP_HEIGHT = 9000;

// Konvaのステージ作成
const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: true, // マップをドラッグで動かせるように
});

// レイヤー（層）をいくつか作ります。背景、オブジェクト、と分ける
const gridLayer = new Konva.Layer();
const mainLayer = new Konva.Layer();
stage.add(gridLayer, mainLayer);
const mapCenterX = MAP_WIDTH / 2;
const mapCenterY = MAP_HEIGHT / 2;

// 画面の中心にマップの中心がくるようにステージの位置を調整
const initialX = window.innerWidth / 2 - mapCenterX;
const initialY = window.innerHeight / 2 - mapCenterY;

stage.x(initialX);
stage.y(initialY);

// 1. 9000x9000のマス目（グリッド）を描画
const gridSize = 100; // 1マスのサイズ
// 縦線
for (let i = 0; i <= MAP_WIDTH / gridSize; i++) {
    gridLayer.add(new Konva.Line({
        points: [i * gridSize, 0, i * gridSize, MAP_HEIGHT],
        stroke: '#ccc',
        strokeWidth: 1,
    }));
}
// 横線
for (let j = 0; j <= MAP_HEIGHT / gridSize; j++) {
    gridLayer.add(new Konva.Line({
        points: [0, j * gridSize, MAP_WIDTH, j * gridSize],
        stroke: '#ccc',
        strokeWidth: 1,
    }));
}

// 2. 円環を描画
const ring = new Konva.Arc({
    x: 4500, // マップの中心X
    y: 4500, // マップの中心Y
    innerRadius: 1000, // 内側の半径
    outerRadius: 1200, // 外側の半径
    angle: 90,         // 角度（90度分）
    rotation: 45,      // 開始角度（45度回転）
    stroke: 'black',
    strokeWidth: 2,
});
mainLayer.add(ring);


// 3. スプレッドシートからデータを読み込んで描画
async function loadDataFromSpreadsheet() {
    console.log('データの読み込みを開始');

    // 四角形のデータを読み込み
    const rects = await fetchCSV(RECT_CSV_URL);
    rects.forEach(data => {
        if (!data.x || !data.y) return; // 座標がないデータはスキップ

        const group = new Konva.Group({
            x: parseFloat(data.x),
            y: parseFloat(data.y),
        });

        group.add(new Konva.Rect({
            width: parseFloat(data.width) || 100,
            height: parseFloat(data.height) || 100,
            fill: data.color || 'skyblue',
            stroke: 'black',
            strokeWidth: 2,
        }));

        group.add(new Konva.Text({
            text: data.name || '',
            fontSize: 18,
            fontFamily: 'Arial',
            fill: 'black',
            padding: 5,
            y: parseFloat(data.height) || 100, // 四角形の下に表示
        }));
        mainLayer.add(group);
    });

    // 画像のデータを読み込み
    const images = await fetchCSV(IMAGE_CSV_URL);
    images.forEach(data => {
        if (!data.x || !data.y || !data.imageUrl) return;

        Konva.Image.fromURL(data.imageUrl, (imageNode) => {
            imageNode.setAttrs({
                x: parseFloat(data.x),
                y: parseFloat(data.y),
                width: parseFloat(data.width) || 100,
                height: parseFloat(data.height) || 100,
            });
            mainLayer.add(imageNode);
        });
    });

    console.log('データの描画が完了');
}

// CSVを読み込む関数
function fetchCSV(url) {
    return new Promise(resolve => {
        Papa.parse(url, {
            download: true,
            header: true,
            complete: (results) => {
                resolve(results.data);
            },
        });
    });
}

// 4. スクロールで拡縮（ズーム）できるよう
const scaleBy = 1.1; // ズームの倍率
stage.on('wheel', (e) => {
    e.evt.preventDefault(); // ページのスクロールを防ぐ

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1; // ホイールの方向

    // 上にスクロールで拡大、下にスクロールで縮小
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
});

// ウィンドウサイズが変わった時にキャンバスサイズを合わせる
window.addEventListener('resize', () => {
    stage.width(window.innerWidth);
    stage.height(window.innerHeight);
});

// 実行！
loadDataFromSpreadsheet();