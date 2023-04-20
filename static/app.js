function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
}

// set up basic variables for app

const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');

const englishLink = document.querySelector('#english');
const portugueseLink = document.querySelector('#portuguese');

englishLink.addEventListener('click', (event) => {
  event.preventDefault();
  document.cookie = 'lang=en';
  window.location.reload();
});

portugueseLink.addEventListener('click', (event) => {
  event.preventDefault();
  document.cookie = 'lang=pt';
  window.location.reload();
});

const synth = window.speechSynthesis;

async function getVoices() {
  const synth = window.speechSynthesis;
  await new Promise(resolve => synth.onvoiceschanged = resolve);
  return synth.getVoices();
}

async function init() {
  const voices = await getVoices();
  console.log(getCookieValue('lang'));
  const lang = getCookieValue('lang');
  let voice;
  if (lang === 'en') {
    voice = voices.find(voice => voice.lang.startsWith('en'));
  } else if (lang === 'pt') {
    voice = voices.find(voice => voice.lang.startsWith('pt'));
  }

  // rest of your code that uses the voices
  // }

  // init();


  // disable stop button while not recording

  stop.disabled = true;

  // visualiser setup - create web audio api context and canvas

  let audioCtx;
  const canvasCtx = canvas.getContext("2d");

  //main block for doing the audio recording

  if (navigator.mediaDevices.getUserMedia) {
    console.log('getUserMedia supported.');

    const constraints = { audio: true };
    let chunks = [];

    let onSuccess = function (stream) {
      const mediaRecorder = new MediaRecorder(stream);

      visualize(stream);

      record.onclick = function () {
        mediaRecorder.start();
        console.log(mediaRecorder.state);
        console.log("recorder started");
        record.style.background = "red";

        stop.disabled = false;
        record.disabled = true;
      }

      stop.onclick = function () {
        mediaRecorder.stop();
        console.log(mediaRecorder.state);
        console.log("recorder stopped");
        record.style.background = "";
        record.style.color = "";
        // mediaRecorder.requestData();

        stop.disabled = true;
        record.disabled = false;
      }

      mediaRecorder.onstop = function (e) {
        console.log("data available after MediaRecorder.stop() called.");

        const clipName = '' //prompt('Enter a name for your sound clip?', 'My unnamed clip');

        const clipContainer = document.createElement('article');
        const clipLabel = document.createElement('p');
        const audio = document.createElement('audio');
        const deleteButton = document.createElement('button');

        clipContainer.classList.add('clip');
        audio.setAttribute('controls', '');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';

        if (clipName === null) {
          clipLabel.textContent = 'My unnamed clip';
        } else {
          clipLabel.textContent = clipName;
        }

        clipContainer.appendChild(audio);
        clipContainer.appendChild(clipLabel);
        clipContainer.appendChild(deleteButton);
        soundClips.appendChild(clipContainer);

        audio.controls = true;
        const blob = new Blob(chunks, { 'type': 'audio/mpeg', 'codecs': 'mp3' });
        chunks = [];
        const audioURL = window.URL.createObjectURL(blob);
        audio.src = audioURL;
        console.log("recorder stopped");
        console.log(blob)



        // Assuming you have a Blob object named "audioBlob"
        const formData = new FormData();
        formData.append('audioFile', blob, 'filename.mp3');

        fetch('/upload-audio', {
          method: 'POST',
          body: formData,
        })
          .then((response) => response.json())
          .then((response) => {

            let Transcription = document.getElementById("transcription");
            let whatever = document.createElement("div");
            whatever.innerHTML = response.text
            Transcription.appendChild(whatever);

            return response;
          })
          .then((response) => {
            audioHandler(response)

            function audioHandler(response) {
              console.log("Audio input:", response.text);
              // Send user's input to Flask route
              fetch('/llm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ audioInput: response.text })
              })
                .then(response => response.json())
                .then(data => {
                  console.log("Response:", data);

                  // Do something with the response data here
                  let Transcription = document.getElementById("transcription");
                  let whatever2 = document.createElement("div");
                  whatever2.innerHTML = data.result
                  Transcription.appendChild(whatever2);


                  const utterance = new SpeechSynthesisUtterance(data.result);
                  utterance.voice = voice
                  synth.speak(utterance);
                  

                })
                .then(() => {
                  // inputDialog.value = ''
                })
                .catch(error => console.error(error));
            }

          })

          .then((response) => {
            console.log(response)
            let divPrompt = document.getElementById("chat-dialog");

            // Check if input dialog already exists
            let inputDialog = document.getElementById("input-dialog");
            if (!inputDialog) {
              // If input dialog doesn't exist, create it
              inputDialog = document.createElement("input");
              inputDialog.type = "text";
              inputDialog.placeholder = "Type here or just hit record again";
              inputDialog.id = "input-dialog";
            }

            // Check if submit button already exists
            let submitButton = document.getElementById("submit-button");
            if (!submitButton) {
              // If submit button doesn't exist, create it
              submitButton = document.createElement("button");
              submitButton.innerHTML = "Submit";
              submitButton.id = "submit-button";
              submitButton.addEventListener("click", function () {
                submitHandler(response);
              });
            }

            // Add the input dialog and submit button to the chat dialog
            divPrompt.appendChild(inputDialog);
            divPrompt.appendChild(submitButton);

            // Append text input dialog and submit button to prompt dialog
            let promptDialog = document.createElement("div");
            promptDialog.appendChild(inputDialog);
            promptDialog.appendChild(submitButton);

            divPrompt.appendChild(promptDialog);

            // Handler function for submit button
            function submitHandler(response) {
              let userInput = inputDialog.value;
              console.log("User input:", userInput);

              let Transcription = document.getElementById("transcription");
              let whatever = document.createElement("div");
              whatever.innerHTML = userInput
              Transcription.appendChild(whatever);

              // Send user's input to Flask route
              fetch('/llm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ audioInput: userInput })
              })
                .then(response => response.json())
                .then(data => {
                  console.log("Response:", data);
                  console.log(lang)
                  // Do something with the response data here
                  let Transcription = document.getElementById("transcription");
                  let whatever2 = document.createElement("div");
                  whatever2.innerHTML = data.result
                  Transcription.appendChild(whatever2);

                  
                  const utterance = new SpeechSynthesisUtterance(data.result);
                  utterance.voice = voice
                  synth.speak(utterance);

                })
                .then(() => {
                  inputDialog.value = ''
                })
                .catch(error => console.error(error));
            }

          })

          .catch(error => {
            // Handle errors
          });




        deleteButton.onclick = function (e) {
          e.target.closest(".clip").remove();
        }

        clipLabel.onclick = function () {
          const existingName = clipLabel.textContent;
          const newClipName = prompt('Enter a new name for your sound clip?');
          if (newClipName === null) {
            clipLabel.textContent = existingName;
          } else {
            clipLabel.textContent = newClipName;
          }
        }
      }

      mediaRecorder.ondataavailable = function (e) {
        chunks.push(e.data);
        console.log(chunks);
      }
    }

    let onError = function (err) {
      console.log('The following error occured: ' + err);
    }

    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

  } else {
    console.log('getUserMedia not supported on your browser!');
  }

  function visualize(stream) {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    //analyser.connect(audioCtx.destination);

    draw()

    function draw() {
      const WIDTH = canvas.width
      const HEIGHT = canvas.height;

      requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      canvasCtx.beginPath();

      let sliceWidth = WIDTH * 1.0 / bufferLength;
      let x = 0;


      for (let i = 0; i < bufferLength; i++) {

        let v = dataArray[i] / 128.0;
        let y = v * HEIGHT / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();

    }

  }

  window.onresize = function () {
    canvas.width = mainSection.offsetWidth;
  }

  window.onresize();

}

init();