import React, { useState } from 'react';

function TextBoxAndSubmitButton() {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(inputValue);
    // Your submit logic here
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder="Enter text here"
      />
      <button type="submit">Submit</button>
    </form>
  );
}

export default TextBoxAndSubmitButton;
