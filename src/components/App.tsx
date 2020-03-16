import * as React from 'react';
import GIF from '../../lib/gif';

const canvasRef = React.createRef();
const gifRenderCanvasRef = React.createRef();
console.log('#######worker');

let salutHands = [];
const image1 = new Image();
image1.src = 'salut_1.png';
image1.addEventListener('load', () => {
  console.log('image 1 ready', salutHands);
  salutHands.push(image1);
});
const image2 = new Image();
image2.src = 'salut_2.png';
image2.addEventListener('load', () => {
  console.log('image 2 ready', salutHands);
  salutHands.push(image2)
});
export const App = (): React.JSX => {
  const [gifUrl, setGifUrl] = React.useState();
  const [canvasContext, setCanvasContext] = React.useState();
  const [userImage, setUserImage] = React.useState();
  const [animationState, setAnimationState] = React.useState<{ clipX: number, clipY: number, startingTimestamp: number }>({
    clipX: 0,
    clipYy: 0,
    startingTimestamp: 0,
    frameDelay: 100
  });

  const renderImagesToCanvas = (canvasContext: CanvasRenderingContext2D, frame: number) => {
    canvasContext.clearRect(0,0,canvasRef?.current?.width, canvasRef?.current?.height);
    canvasContext.drawImage(userImage, 0, 0);
    canvasContext.drawImage(salutHands[frame], animationState.clipX, animationState.clipY);
  };

  const renderPreviewCanvas = () => {
    if(canvasContext && userImage && salutHands) {
      const frame = Math.floor((+ new Date() - animationState.startingTimestamp)/animationState.frameDelay)%2;
      renderImagesToCanvas(canvasContext, frame);
    }
    requestAnimationFrame(renderPreviewCanvas);
  };

  const createGif = () => {
    const gif = new GIF({
      workers: 2,
      quality: 10
    });
    console.log('#######', animationState.frameDelay);
    const context = gifRenderCanvasRef?.current?.getContext('2d');
    gif.setOptions({ width: 64, height: 64, workerScript: 'gif.worker.js', transparent: '#ffffff', quality: 0});
    renderImagesToCanvas(context, 0);
    gif.addFrame(context, {copy: true, delay: animationState.frameDelay});
    renderImagesToCanvas(context, 1);
    gif.addFrame(context, {copy: true, delay: animationState.frameDelay});
    gif.on('finished', (blob) => {
      setGifUrl(URL.createObjectURL(blob));

    });
    gif.render();
  };

  const renderImg = (url: string) => {
    if (url) {
      return <img src={ url }/>;
    }
    return <span>Loading..</span>;
  };

  const newImage = (event) => {
    const file = document.getElementById('fileUpload')?.files?.[ 0 ];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const userImage = new Image();
        userImage.addEventListener('load', () => {
          setUserImage(userImage);
        });
        userImage.src = event.target.result as string;
      };
      reader.readAsDataURL(file);
    }
    event.preventDefault();
  };

  const updateSalutPosition = (clickEvent) => {
    const rect = canvasRef?.current?.getBoundingClientRect();
    setAnimationState({
      ...animationState,
      clipX: clickEvent.clientX - rect.left - 15,
      clipY: clickEvent.clientY - rect.top - 20,
      startingTimestamp: + new Date()
    });
  };

  const changeAnimationSpeed = (event) => {
    setAnimationState({...animationState, frameDelay: event.target.value});
  };

  React.useEffect(() => {
    setCanvasContext(canvasRef?.current?.getContext('2d'));

  }, []);

  React.useEffect(() => {
    const requestId = requestAnimationFrame(renderPreviewCanvas);
    return () => {
      cancelAnimationFrame(requestId);
    }
  });

  return (<>
    <h1>New image</h1>
    <form onSubmit={ newImage }>
      <label>
        Image that needs some enhancement
        <input id="fileUpload" type="file"/>
      </label>
      <button type="submit">Salutify</button>
    </form>
    <h1>Fine tune</h1>
    <canvas onClick={ updateSalutPosition } ref={ canvasRef }/>
    <input type='range' onInput={changeAnimationSpeed} value={ animationState.frameDelay } min={20} max={1000} />
    <canvas ref={ gifRenderCanvasRef } style={ {visibility: 'hidden'} } />
    <button onClick={createGif}>Convert to GIF</button>
    <h1>gif</h1>
    { renderImg(gifUrl) }
  </>);
};
