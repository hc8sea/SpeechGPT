import React from "react"

export default function App() {
    return (
        <div class="wrapper">

            <section class="main-controls">
                <canvas class="visualizer" height="60px"></canvas>
                <div id="buttons">
                    <button class="record">Record</button>
                    <button class="stop">Stop</button>
                </div>
            </section>

            <section class="sound-clips">
            </section>
            <div id="transcription"></div>
            <div id="chat-dialog"></div>

        </div>
    )
}