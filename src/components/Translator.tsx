'use client';

import { useState, useEffect, useRef } from 'react';
import { default as languagesCodesData } from '@/data/language-codes.json'
import { default as countryCodesData } from '@/data/country-codes.json'
import { FaMicrophone } from "react-icons/fa";
import { HiSpeakerWave } from "react-icons/hi2";
import { FaExchangeAlt } from "react-icons/fa";

const languageCodes: Record<string, string> = languagesCodesData;
const countryCodes: Record<string, string> = countryCodesData;

const Translator = () => {
    const recognitionRef = useRef<SpeechRecognition>();
    
    const [isActive, setIsActive] = useState<boolean>(false);
    const [text, setText] = useState<string>();
    const [translation, setTranslation] = useState<string>();
    const [language, setLanguage] = useState<string>('BRAZIL');
    const [languageCode, setLanguageCode] = useState<string>('pt-BR');
    const [voices, setVoices] = useState<Array<SpeechSynthesisVoice>>();
    const [isListVisible, setIsListVisible] = useState<boolean>(false);
    console.log(isActive);
    
    const availableLanguages = Array.from(new Set(voices?.map(({lang}) => lang))).map(lang => {
      const split = lang.split('-');
      const languageCode: string = split[0];
      const countryCode: string = split[1];
      return {
        lang,
        label: languageCodes[languageCode] || lang,
        dialect: countryCodes[countryCode]
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label));

    interface AvailableLanguage {
      lang: string;
      label: string;
    };
    
    const uniqueLanguages: AvailableLanguage[] = [];

    availableLanguages.forEach((language) => {
      if (!uniqueLanguages.some((l) => l.label === language.label)) {
        uniqueLanguages.push(language);
      }
    });

    const languageList: JSX.Element[] = uniqueLanguages.map(({ lang, label }) => (
      <button key={lang} onClick={() => {
        setLanguage(label.toUpperCase()); 
        setLanguageCode(lang);
      }}>
        {label.toUpperCase()}
      </button>
    ));

    function toggleList() {
      if(isListVisible === false){
        setIsListVisible(true)
      } else {
        setIsListVisible(false)
      }
    }
    
    // Finds voice name includes "Google" or "Luciana", otherwise the first available voice 
    const availableVoices = voices?.filter(({lang}) => lang === languageCode)
    const activeVoice = 
      availableVoices?.find(({name}) => name.includes("Google"))
      || availableVoices?.find(({name}) => name.includes("Luciana"))
      || availableVoices?.[0]

    useEffect(() => {
      const voices = window.speechSynthesis.getVoices();
      if (Array.isArray(voices) && voices.length > 0){
        setVoices(voices);
        return;
      }
      if ('onvoiceschanged' in window.speechSynthesis){
        window.speechSynthesis.onvoiceschanged = function() {
          const voices = window.speechSynthesis.getVoices();
          setVoices(voices);
        }
      }  
    },[])
    
    // fire this fuction by clicking 'RECORD'
    function handleOnRecord() {
        if (isActive) {
            recognitionRef.current?.stop();
            setIsActive(false);
            return;
        }
        // setIsActive(true);

        // const flashingInterval = setInterval(() => {
        //   setIsActive(prevIsActive => !prevIsActive);
        // }, 500)

        speak(' ')
      
        // Ensure working Chrome and Safari
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Recording start
      recognitionRef.current.onstart = function() {
        setIsActive(true);
      };

      // End Recording
      recognitionRef.current.onend = function() {
        // clearInterval(flashingInterval);
        setIsActive(false);
      };

    
      // Translate the transcript using openai API
      recognitionRef.current.onresult = async function(event) {
        const transcript = event.results[0][0].transcript;
  
        setText(transcript);
  
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            body: JSON.stringify({
              text: transcript,
              language: languageCode
            })
          });
      
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
      
          const results = await response.json();
      
          setTranslation(results.text);
          speak(results.text)
      
        } catch (error) {
          console.error('Error fetching or parsing translation:', error);
        }
      }
      recognitionRef.current.start();
    }

    // Speak translated text with the language voice
    function speak(text: string) {
      if( !activeVoice ) return;

          let utterance = new SpeechSynthesisUtterance(text);

          const voices = window.speechSynthesis.getVoices();
          
          utterance.voice = activeVoice;
          window.speechSynthesis.speak(utterance);
    }

  return (
    <div id='translator'>

      <div className='contents-wrapper'>

        <div className='input folder'>
          <div className='labels'>
            <div className='category'>INPUT</div>
            <div className='language input-lan'>ENGLISH</div>
            <div className='empty'></div>
          </div>
          <div className='text-area'>
            <p className='contents'>{text}</p>
            <button 
              className={`icon record-btn ${isActive ? 'flashing-red' : ""}`} 
              onClick={handleOnRecord}
            >
              <FaMicrophone />
            </button>
          </div>
        </div>

        <div className='translate-icon'>
          <div className='change-icon'><FaExchangeAlt /></div>
        </div>
        

        <div className='output folder'>
          <div className='labels'>
              <div className='category'>OUTPUT</div>
              <div className='language output-lan' onClick={toggleList}>
                {language}
                <div className='country-list'>
                {isListVisible ? languageList : null}
                </div>
              </div>
              <div className='empty'></div>
          </div>

            <div className='text-area'>
              <p className='contents'>{translation}</p>
              <button className='icon'>
                <HiSpeakerWave />
              </button>
            </div>
        </div>
      </div>   

    </div>
  )
}

export default Translator
