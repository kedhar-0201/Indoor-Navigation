import React, { useState } from 'react';
import Splash from './components/Splash';
import CollegePicker from './components/CollegePicker';
import Home from './components/Home';
import Scanner from './components/Scanner';
import Navigation from './components/Navigation';
import { unlockAudio } from './utils/speech';
import './App.css';

function App() {
  const [screen, setScreen] = useState('splash');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [quickDestination, setQuickDestination] = useState(null);

  const handleSplashDone = () => setScreen('college');

  const handleCollegeSelect = (college) => {
    setSelectedCollege(college);
    setScreen('home');
  };

  const handleStart = (destination = null) => {
    unlockAudio();
    setQuickDestination(destination);
    setScreen('scanner');
  };

  const handleLocationSet = (locationId, destination = null) => {
    unlockAudio();
    setCurrentLocation(locationId);
    setScreen('navigation');
    if (destination) setQuickDestination(destination);
  };

  const handleGoHome = () => {
    setScreen('home');
    setQuickDestination(null);
  };

  const handleChangeLocation = () => setScreen('scanner');

  const floorMap = selectedCollege || null;

  return (
    <div style={styles.appWrapper} onClick={unlockAudio}>
      {screen === 'splash' && (
        <Splash onDone={handleSplashDone} />
      )}
      {screen === 'college' && (
        <CollegePicker onSelect={handleCollegeSelect} />
      )}
      {screen === 'home' && (
        <Home
          onStart={handleStart}
          currentLocation={currentLocation}
          college={selectedCollege}
        />
      )}
      {screen === 'scanner' && floorMap && (
        <Scanner
          onLocationSet={handleLocationSet}
          onGoHome={handleGoHome}
          quickDestination={quickDestination}
          floorMap={floorMap}
        />
      )}
      {screen === 'navigation' && currentLocation && floorMap && (
        <Navigation
          currentLocation={currentLocation}
          onGoHome={handleGoHome}
          onChangeLocation={handleChangeLocation}
          quickDestination={quickDestination}
          floorMap={floorMap}
        />
      )}
    </div>
  );
}

const styles = {
  appWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fb',
  },
};

export default App;