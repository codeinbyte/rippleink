let showDrawing = true;
let drawingEnabled = false;
let eraserEnabled = false;
let currentPath;
let svgCanvasWidth=0, svgCanvasHeight=0;
const svg = document.querySelector('svg#drawing-content');
const drawButton = document.getElementById('drawBtn');
const noteContent = document.querySelector('.fr-wrapper');
const drawingEvent = document.getElementById('drawing_event');

let noteContentPosition = noteContent.getBoundingClientRect();
let noteContentWidth = noteContent.clientWidth;
let noteContentHeight = noteContent.clientHeight;
let noteContentTop = noteContent.offsetTop;
let noteContentLeft = noteContent.offsetLeft;

svg.style.pointerEvents = 'none';


// Toggle between showing and hiding drawing
// (only used in public note & collab viewing)
const showHideToggle = () => {
  showDrawing = !showDrawing;
  if (showDrawing) {
    svg.style.display = 'inline-block';
    drawButton.textContent = 'Hide Drawing';
    setSize();
  } else {
    svg.style.display = 'none';
    drawButton.textContent = 'Show Drawing';
  }
}

// Toggle between showing and hiding drawing
const showHideDrawing = () => {
  showDrawing = !showDrawing;
  if (showDrawing) {
    svg.style.display = 'inline-block';
    setSize();
  } else {
    // disable drawing when hiding drawing
    if (drawingEnabled) {
      drawToggle();
    }
    svg.style.display = 'none';
  }
}

// Toggle between typing mode and drawing mode
const drawToggle = () => {
  drawingEnabled = !drawingEnabled;
  if (drawingEnabled) {
    // show drawing if it is not visible
    if (!showDrawing) {
      showHideDrawing();
    }
    svg.style.pointerEvents = 'auto';
    drawButton.textContent = 'Drawing Mode';
    svg.addEventListener('pointerdown', handleMouseDown);
    svg.addEventListener('pointerup', handleMouseUp);
    svg.addEventListener('pointermove', handleMouseMove);
    setSize();
  } else {
    svg.style.pointerEvents = 'none';
    drawButton.textContent = 'Typing Mode';
    svg.removeEventListener('pointerdown', handleMouseDown);
    svg.removeEventListener('pointerup', handleMouseUp);
    svg.removeEventListener('pointermove', handleMouseMove);
  }
};

const setSize = () => {
  // Set the value of width, height, top, left, when the windows change size
  noteContentTop = noteContent.offsetTop+noteContentPosition.top-50;
  noteContentLeft = noteContent.offsetLeft+noteContentPosition.left;
  noteContentWidth = noteContent.clientWidth;
  noteContentHeight = noteContent.clientHeight;
  svgCanvasWidth = (svgCanvasWidth < noteContentWidth+20) ? noteContentWidth : svgCanvasWidth;
  svgCanvasHeight = (svgCanvasHeight < noteContentHeight) ? noteContentHeight : svgCanvasHeight;

  svg.style.left = noteContentLeft + 'px';
  svg.style.top = noteContentTop + 'px';
	svg.setAttribute('width', svgCanvasWidth);
	svg.setAttribute('height', svgCanvasHeight);
};

const handleMouseDown = () => {
  currentPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  currentPath.setAttribute('fill', 'none');
  
  // Set stroke color and width based on eraser/pen mode
  if (eraserEnabled) {
    currentPath.setAttribute('stroke', '#FFFFFF');
    currentPath.setAttribute('stroke-width', 8);
  } else {
    currentPath.setAttribute('stroke', '#000');
    currentPath.setAttribute('stroke-width', 2);
  }
  svg.appendChild(currentPath);
}

const handleMouseUp = () => {
  // if path is null, remove path and return
  if (currentPath.getAttribute('d') === null) {
    svg.removeChild(currentPath);
    currentPath = null;
    return;
  }
  currentPath.setAttribute('d', shortenPath(currentPath));
  currentPath = null;

  // change hidden input value to indicate there is new drawing
  const event = new Event('input');
  drawingEvent.addEventListener('input', function () {
    drawingEvent.value = parseInt(drawingEvent.value)+1;
  });
  drawingEvent.dispatchEvent(event);
}

const handleMouseMove = ({ clientX, clientY }) => {
  if (!currentPath) return;

  let d = currentPath.getAttribute('d');
  const x = clientX-noteContentLeft+window.scrollX;
  const y = clientY-noteContentTop+window.scrollY;

  currentPath.setAttribute('d', d ? d + ` L${x},${y}` : `M${x},${y}`);
}

// Toggle between pen mode and eraser mode
const eraserToggle = () => {
  eraserEnabled = !eraserEnabled;  
  eraseBtn.textContent = eraserEnabled ? 'Eraser Mode' : 'Pen Mode';
};

// Reduce SVG path and smoothen the drawing
const shortenPath = (path) => {
  let newPath='';
  const pathData = path.getAttribute('d');
  const pathDataArray = pathData.split(' ');

  if (pathDataArray.length > 4) {
    for (let i=0; i<pathDataArray.length; i+=2) {
      if (i < 2 || (i+1 == pathDataArray.length-1)) {
        newPath += pathDataArray[i];
        newPath += pathDataArray[i+1];
        continue;
      } else if (i == pathDataArray.length-1) {
        newPath += pathDataArray[i];
        continue;
      } else {
        let path1 = pathDataArray[i].slice(1);
        let path2 = pathDataArray[i+1].slice(1);
        let [x1, y1] = path1.split(',').map(parseFloat);
        let [x2, y2] = path2.split(',').map(parseFloat);
        let distance = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);

        // if distance is this value or higher, both coords will be retained
        if (distance >= 6) {
          newPath += pathDataArray[i];
          newPath += pathDataArray[i+1];
        } else {
          // only one coords is retained
          newPath += pathDataArray[i];
        }
      }
    }
    return newPath;
  } else {
    return pathData;
  }
}

eraseBtn.addEventListener('click', eraserToggle);
window.addEventListener('resize', setSize);
setSize();
