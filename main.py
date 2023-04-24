from flask import Flask, render_template, request, jsonify, session, g
import librosa
import numpy as np
from io import BytesIO
import whisper
from scipy.io import wavfile
import pydub
import openai
from whisper_jax import FlaxWhisperPipline

app = Flask(__name__)
app.secret_key = 'your-secret-key'

@app.before_first_request
def create_variable():
    global model
#    model = whisper.load_model("base")
    global pipeline
    pipeline = FlaxWhisperPipline("openai/whisper-base")

@app.route('/')
def index():
    session['started'] = False
    session['lang'] = request.cookies.get('lang', 'en')
    return render_template('index.html')

@app.route('/upload-audio', methods=['POST'])
def upload_audio():
    audio_file = request.files['audioFile'].read()


    virtual_file = BytesIO(audio_file)

    # Create a file path string that points to the virtual file
    file_path = 'file_virtual.mp3'

    # Use the file path to reference the virtual file
    with open(file_path, 'wb') as f:
        f.write(virtual_file.getbuffer())
    

    
#    result = model.transcribe(file_path)
    result = pipeline(file_path)
    print(result["text"])

    return jsonify(result)

global audio_input
audio_input = ''



@app.route('/llm', methods=['POST'])
def llm():
    input_data = request.get_json()

    # user_input = input_data['input']
    audio_input = input_data['audioInput']
    # Do something with the user's input here


    started = session.get('started', False)
    print(started)
    if not started:
        if session['lang'] == 'en':
            first_message = "You will read a piece of information and then ask me if I need assistance."
        elif session['lang'] == 'pt':
            first_message = "Eu irei te dizer algo e você irá me perguntar se eu preciso de alguma ajuda."
        messages = [
            {"role": "system", "content": first_message},
            {"role": "user", "content": audio_input}
            ]

        session['started'] = True
        
        

        _ = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages)
        _comp = _.choices[0]['message']['content']
        print(_comp)
        messages.append({"role": "assistant", "content": _comp})
        session['messages'] = messages.copy()
    else:
        messages = session['messages'].copy()
        messages.append({"role": "user", "content": audio_input})
        _1 = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages)

        _comp = _1.choices[0]['message']['content'] 
        print(_comp)

        messages.append({"role": "assistant", "content": _comp})
        session['messages'] = messages.copy()
        print([message['content'] for message in messages])


    return jsonify({'result': _comp})

@app.route('/llm2', methods=['POST'])
def llm2():
    _1 = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
            {"role": "assistant", "content": _comp},
            {"role": "user", "content": audio_input},
        ]
    )
    _comp = _.choices[0]['message']['content']    

# if __name__ == '__main__':
#     app.run()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))





