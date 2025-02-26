// PonyvilleFM Web Interface & Mobile App
// Created by deltaryz

// This represents the current selected stream
// Default is MP3 320 (Best Quality)
let stream_url = "https://dj.bronyradio.com/streamhq.mp3";
let selected_stream = "PonyvilleFM";

let streams = {
  "PonyvilleFM": {
    urls: {
      "Best Quality - MP3 320": "https://dj.bronyradio.com/streamhq.mp3",
      "Good Quality - Opus VBR": "https://dj.bronyradio.com/pvfmopus.ogg",
      "Okay Quality - Vorbis 112": "https://dj.bronyradio.com/pvfm1.ogg",
      "Low Quality - AAC 64": "https://dj.bronyradio.com/pvfm1mobile.aac",
    },
    albumText: "PonyvilleFM",
    albumart: "./pvfm1.png",
    lastQuality: 2, // We modify this to keep track of what the user selected
  },
  "PonyvilleFM2 Chill": {
    urls: {
      "MP3 128": "https://luna.ponyvillefm.com/listen/pvfm2/radio.mp3",
    },
    albumText: "PonyvilleFM2 Chill",
    albumart: "./pvfm2.png",
    lastQuality: 0,
  },
  "PonyvilleFM3 No DJs": {
    urls: {
      "MP3 128": "https://dj.bronyradio.com/pvfmfree.mp3",
      "Vorbis 112": "https://dj.bronyradio.com/pvfmfree.ogg",
    },
    albumText: "PonyvilleFM3 No DJs",
    albumart: "./pvfm3.png",
    lastQuality: 0,
  },
  "Luna Radio": {
    urls: {
      "MP3 128": "https://luna.ponyvillefm.com/listen/lunaradio/radio.mp3",
    },
    albumText: "Luna Radio",
    albumart: "./lunaradio.png",
    lastQuality: 0,
  },
}

// Override lastQuality with local setting if present
for (const [stationName, stationData] of Object.entries(streams)) {
  console.log("Checking settings for " + stationName);
  let qualitySetting = localStorage.getItem(stationName);
  if (qualitySetting) {
    console.log("Found, default is " + qualitySetting)
    streams[stationName].lastQuality = qualitySetting; // set to that
  } else {
    console.log("No saved quality");
    streams[stationName].lastQuality = 0; // top is default
  }
}

// check for selectedStream local setting and apply if necessary
let selected_stream_setting = localStorage.getItem("selectedStream");
if (selected_stream_setting) {
  selected_stream = selected_stream_setting;
}

// Set stream_url to what we had last
stream_url = Object.values(streams[selected_stream].urls)[streams[selected_stream].lastQuality];

// We will manipulate these throughout operation of the program
let schedule;
let audio;
let isPlaying = false;
let songHistory = JSON.parse(localStorage.getItem("songHistory"));
if (songHistory == null) songHistory = [];

// Metadata for currently playing song
let songDetails = {
  artist: "",
  title: "",
  album: "",
  albumShort: "",
  albumArt: "",
  listeners: "",
  startTime: "",
};

// TODO: these should be inside an object or something this is a mess
const playPauseButton = document.getElementById("playPauseButton");
const resetButton = document.getElementById("resetButton");
const volumeControl = document.getElementById("volumeControl");
const artistField = document.getElementById("artist");
const titleField = document.getElementById("title");
const listenersField = document.getElementById("listeners");
const stationSelector = document.getElementById("stationSelector");
const qualitySelector = document.getElementById("qualitySelector");
const installPWAButton = document.getElementById("installPWA");
const googlePlayButton = document.getElementById("googlePlayButton");
const eventDisplay = document.getElementById("eventDisplay");
const eventStatus = document.getElementById("eventStatus");
const eventName = document.getElementById("eventName");
const timeUntilEvent = document.getElementById("timeUntilEvent");

// Initialize deferredPrompt for use later to show browser install prompt.
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  console.log(`'beforeinstallprompt' event was fired.`);
  // Make button visible
  if (!window.matchMedia("(display-mode: standalone)").matches) {
    installPWAButton.hidden = false;
  }
});

// Show Google Play if we're not a PWA
if (!window.matchMedia("(display-mode: standalone)").matches) {
  googlePlayButton.hidden = false;
}

// Click on "Install PWA"
installPWAButton.addEventListener("click", async () => {
  console.log("Click");
  // Show the install prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  // Optionally, send analytics event with outcome of user choice
  console.log(`User response to the install prompt: ${outcome}`);
  // We've used the prompt and can't use it again, throw it away
  deferredPrompt = null;
});

// Click on "Google Play"
googlePlayButton.addEventListener("click", async () => {
  window.open("https://play.google.com/store/apps/details?id=com.deltaryz.pvfm", "_blank", "noopener");
});

// Make sure external links don't open in the PWA
document.addEventListener("click", function (e) {
  const target = e.target.closest("a"); // Find the closest anchor element
  if (target && target.hostname !== window.location.hostname) {
    // If the link is external, prevent default behavior
    e.preventDefault();
    // Open the link in the system's default browser
    window.open(target.href, "_blank", "noopener");
  }
});

// Set height for PWA
window.resizeTo(500, 700);
window.addEventListener("resize", function (event) {
  event.preventDefault();
  window.resizeTo(500, 700);
});

// Dropdown to select station
let stationSelectorDropdown = document.createElement("select");
stationSelectorDropdown.id = "select";
stationSelectorDropdown.className = "dropdown";

// Dropdown to select quality
let qualitySelectorDropdown = document.createElement("select");
qualitySelectorDropdown.id = "select";
qualitySelectorDropdown.className = "dropdown";

// Wipe and recreate quality selector based on provided station
let recreateQualityDropdown = function (station) {
  qualitySelectorDropdown.options.length = 0; // remove existing options
  let currentIndex = 0;
  for (const [qualityName, qualityData] of Object.entries(streams[station].urls)) {
    const qualityOption = document.createElement("option");
    qualityOption.textContent = qualityName;
    qualityOption.value = currentIndex;
    currentIndex++;
    qualitySelectorDropdown.appendChild(qualityOption);
  }
  qualitySelectorDropdown.selectedIndex = streams[station].lastQuality;
}

// Populate the station selector dropdown 
for (const [stationName, stationData] of Object.entries(streams)) {
  const stationOption = document.createElement("option");
  stationOption.textContent = stationName;
  stationSelectorDropdown.appendChild(stationOption);

  // select the default one
  if (selected_stream == stationName) stationOption.selected = true;
}

// Change streams and update dropdowns
// Respects default stream setting
// DOES NOT RESET / START PLAYING
let changeStreamAndQuality = function (streamName, streamQualityIndex) {

  // update streams
  streams[streamName].lastQuality = streamQualityIndex;

  // save to localStorage
  localStorage.setItem(streamName, streamQualityIndex);
  localStorage.setItem("selectedStream", streamName);

  recreateQualityDropdown(streamName);
  const newStreamUrl = Object.values(streams[streamName].urls)[streamQualityIndex];
  console.log("Selected new stream URL: " + newStreamUrl);

  stopStreaming();

  selected_stream = streamName;
  stream_url = newStreamUrl;
}

// init dropdowns
changeStreamAndQuality(selected_stream, streams[selected_stream].lastQuality);

// Change the station
stationSelectorDropdown.addEventListener("change", function (event) {
  console.log("User selected station: " + event.target.value);

  // Respect last selected quality
  changeStreamAndQuality(event.target.value, streams[event.target.value].lastQuality);
  resetStream();
});

// Change the quality
qualitySelectorDropdown.addEventListener("change", function (event) {
  let newUrl = Object.values(streams[selected_stream].urls)[event.target.value];

  console.log("User selected quality index: " + event.target.value);
  console.log("This becomes URL: " + newUrl)

  changeStreamAndQuality(selected_stream, event.target.value);
  resetStream();
});

// Add the dropdowns to the page
stationSelector.appendChild(stationSelectorDropdown);
stationSelector.appendChild(qualitySelectorDropdown);

console.log("Stream URL: " + stream_url);

// set volume to saved value if present
let settings_volume = localStorage.getItem("volume");
if (settings_volume) {
  console.log("Saved volume setting is present:\n" + settings_volume);
  if (audio != undefined) audio.volume = settings_volume;
  volumeControl.value = settings_volume * 100;
}

console.log("Volume: " + volumeControl.value);

// Handle buttons
playPauseButton.addEventListener("click", () => {
  playPause();
});

resetButton.addEventListener("click", () => {
  resetStream();
});

// Play/pause function
function playPause() {
  if (isPlaying) {
    audio.pause();
  } else {
    audio.play();

    // TODO: put this in a function and merge with the stuff in fetchSongDetails()
    let changeCheck = songDetails.artist + songDetails.title; // the user never sees this
    if (songHistory[0] != null) {
      if (changeCheck == songHistory[0].artist + songHistory[0].title) {
        // Song has not changed since our last save
      } else {
        songHistory.unshift(structuredClone(songDetails));
      }
    } else {
      songHistory.unshift(structuredClone(songDetails));
    }

    // cap history length
    if (songHistory.length >= 15) songHistory.length = 15;
    console.log("History: \n", songHistory);

  }
  isPlaying = !isPlaying;
  updateButtonText();
  updateMediaSession();
  audio.volume = volumeControl.value / 100;
}

// Kill everything
function stopStreaming() {
  if (audio != undefined) {
    audio.pause();
    audio.src = "";
    audio.load();
  }
  console.log("Stop");
  isPlaying = false;
  updateButtonText();
}

// Re-initialize the stream
function resetStream() {
  // TODO: Change colors of button based on status
  console.log("Reset");
  stopStreaming();

  audio = new Audio(stream_url);

  resetButton.innerHTML = "Loading...";

  console.log("Resetting stream - " + stream_url);

  // Ensure the audio stream plays after it is loaded
  audio.addEventListener("canplay", () => {
    console.log("Audio can play, starting playback.");
    audio.volume = volumeControl.value / 100;
    audio.play().catch((error) => {
      console.error("Error starting audio:", error);
      // TODO: Show error on page
    });
    isPlaying = true;
    fetchSongDetails();
    updateButtonText();
    resetButton.innerHTML = "↻ Reset";
  });
}

// Volume control
volumeControl.addEventListener("input", (event) => {
  const volume = event.target.value / 100;
  audio.volume = volume;

  localStorage.setItem("volume", volume);
});

// Play/pause button update based on isPlaying variable
function updateButtonText() {
  playPauseIcon.src = isPlaying ? "pause.svg" : "play.svg";
}

// Update metadata info for browsers and mobile devices
function updateMediaSession() {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: songDetails.title,
      artist: songDetails.artist,
      artwork: [
        {
          src: songDetails.albumArt,
          sizes: "1000x1000",
          type: "image/png",
        },
      ],
      album: songDetails.album,
    });
  }
}

// Respond to button controls
if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => playPause());
  navigator.mediaSession.setActionHandler("stop", () => stopStreaming());
  navigator.mediaSession.setActionHandler("pause", () => playPause());
}

// Make sure button represents current state of playback on page load
document.addEventListener("DOMContentLoaded", () => {
  updateButtonText();
});

// fetch and update song details
async function fetchSongDetails() {
  try {
    let currentStream = streams[selected_stream];

    let response;
    let data;
    let changeCheck = songDetails.artist + songDetails.title; // the user never sees this

    // TODO: Detect unqiue albumart for PVFM2 and Luna since azuracast actually gives us that

    // Pull pvfm metadata
    response = await fetch("https://ponyvillefm.com/data/nowplaying");
    data = await response.json();
    nowPlayingData = data.one || {};
    songDetails.albumShort = "PVFM";

    // TODO: Maybe use a different field than albumText for this?
    // Override Luna Radio
    if (currentStream.albumText == "Luna Radio") {
      nowPlayingData = data.lunaradio || {};
      songDetails.albumShort = "Luna";
    }

    // Override PVFM3
    if (currentStream.albumText == "PonyvilleFM3 No DJs") {
      nowPlayingData = data.free || {};
      songDetails.albumShort = "PVFM3";
    }

    if (currentStream.albumText == "PonyvilleFM2 Chill") {
      nowPlayingData = data.two || {};
      songDetails.albumShort = "PVFM2";
    }

    // Populate local metadata
    songDetails.listeners = nowPlayingData.listeners || "0";
    songDetails.artist = nowPlayingData.artist || "";
    songDetails.title = nowPlayingData.title || "";

    songDetails.album = currentStream.albumText; // Use album name associated with URL
    songDetails.albumArt = currentStream.albumart; // Use album art associated with URL

    // Update page
    artistField.innerHTML = songDetails.artist;
    titleField.innerHTML = songDetails.title;
    listenersField.innerHTML = "🐴 " + songDetails.listeners;

    // Check if the song has changed
    if (changeCheck != songDetails.artist + songDetails.title) {
      console.log("Song has changed");
      songDetails.startTime = Date.now();

      // TODO: put this in a function and merge with the stuff in playPause()

      // only update now playing if it's actually playing
      if (isPlaying) {
        // put at the beginning of songHistory
        if (songHistory[0] != undefined) {
          // check for duplicate
          if (songHistory[0].title != songDetails.title) songHistory.unshift(structuredClone(songDetails));
        } else {
          songHistory.unshift(structuredClone(songDetails));
        }
      } else {
        console.log("Song is not actually playing, not saving");
      }

      // cap history length
      if (songHistory.length >= 15) songHistory.length = 15;
      console.log("History: \n", songHistory);

      // save in localStorage
      localStorage.setItem("songHistory", JSON.stringify(songHistory));

    } else {
      console.log("Song has not changed")
    }

    // Display time until upcoming event
    if (schedule != undefined) calculateTimeUntilEvent(schedule[0]);

    // Update media controls
    updateMediaSession();

    console.log("Current song details:", songDetails);
  } catch (error) {
    // TODO: Visualize error on page

    console.error("Error fetching song details:", error);
  }
}

// fetch schedule from PVFM endpoint
async function fetchSchedule() {
  const url = "https://ponyvillefm.com/data/schedule";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    if (data.result && data.result.length > 0) {
      schedule = data.result;
      const firstEvent = data.result[0];

      // Sorry ND but your name shouldnt be in the title, its also right below it
      let firstEventName = firstEvent.name;
      if (firstEventName == "Lantern In The Dark with Nicolas Dominique") firstEventName = "Lantern In The Dark";

      // Log the event details
      console.log(`First event: ${firstEvent.name}`);
      console.log(
        `Event starts at: ${new Date(
          firstEvent.start_unix * 1000
        ).toLocaleString()}`
      );

      // Call the function to calculate and print the remaining time
      calculateTimeUntilEvent(firstEvent);

      eventDisplay.hidden = false;

      // Put upcoming event title in box
      eventName.innerHTML =
        "<b>" +
        firstEventName +
        '</b> <br /><i class="eventPresentedBy">presented by ' +
        firstEvent.host +
        "</i>";
    } else {
      console.log("No schedule entries found");
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

// Song history modal
let historyButton = document.getElementById("historyButton");
historyButton.onclick = function () {
  console.log("Activating song history modal")

  var modalElement = document.createElement('div');
  modalElement.id = "historyModal";

  let modalTitle = document.createElement('div');
  modalTitle.id = 'modalTitle';
  modalTitle.innerHTML = "Playback History";

  modalElement.appendChild(modalTitle);

  for (songHistoryIndex in songHistory) {
    let songHistoryElement = songHistory[songHistoryIndex];

    let songTime = new Date(songHistoryElement.startTime);

    // container for each thing
    let containerDiv = document.createElement('div');
    containerDiv.id = "songHistoryContainer";

    modalElement.appendChild(containerDiv);

    // each station gets an icon
    let stationIcon = document.createElement('img');
    switch (songHistoryElement.albumShort) {
      case 'PVFM':
        stationIcon.src = "./pvfm1_small.png";
        break;
      case 'PVFM2':
        stationIcon.src = "./pvfm2_small.png";
        break;
      case 'PVFM3':
        stationIcon.src = "./pvfm3_small.png";
        break;
      case 'Luna':
        stationIcon.src = "./lunaradio_small.png";
        break;
    }

    stationIcon.style.height = "40px";

    containerDiv.appendChild(stationIcon);

    // actual metadata
    let songData = document.createElement('div');
    songData.id = "songHistoryData";
    songData.innerHTML = "<b>" + songTime.toLocaleTimeString("en-US") + "</b><br/>" + songHistoryElement.artist + "<br/>" + songHistoryElement.title;

    containerDiv.appendChild(songData);
  }
  modalElement.style.fontSize = 9;

  mui.overlay('on', modalElement);
}

// Prep schedule modal when schedule button is clicked
let scheduleButton = document.getElementById("scheduleButton");
scheduleButton.onclick = function () {
  console.log("Activating schedule modal")

  var modalElement = document.createElement('div');
  modalElement.id = "scheduleModal"

  let modalTitle = document.createElement('div')
  modalTitle.id = "modalTitle";
  modalTitle.innerHTML = "Upcoming Shows";

  let modalSubtitle = document.createElement('div');
  modalSubtitle.id = "modalSubtitle";
  modalSubtitle.innerHTML = "/ / / <a href='https://ponyvillefm.com/shows'>Full Shows List</a> / / / <a href='https://ponyvillefm.com/team'>Our Team</a> / / / <a href='https://mixes.deltaryz.com'>∆•MIX</a> / / /";

  modalElement.appendChild(modalSubtitle);
  modalElement.appendChild(modalTitle);

  // TODO: Unify this with calculateTimeUntilEvent() somehow?

  let currentEventIndex = 1;

  // construct divs for each event
  for (pvfmEventIndex in schedule) {
    let pvfmEvent = schedule[pvfmEventIndex];

    // Calculate date
    const eventDate = new Date(pvfmEvent.start_unix * 1000);
    const eventEndDate = new Date(pvfmEvent.end_unix * 1000);
    const now = new Date();

    // Calculate the difference in milliseconds
    const timeDiffMs = eventDate - now;
    const timeEndDiffMs = eventEndDate - now;

    // Convert the difference to hours and minutes
    const hoursLeft = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const minutesLeft = Math.floor(
      (timeDiffMs % (1000 * 60 * 60)) / (1000 * 60)
    );

    // Format options for time display
    const options = {
      timeZoneName: "short",
      hour: "numeric",
      minute: "numeric",
      day: "numeric",
      month: "short",
    };
    const localTimeScheduled = eventDate.toLocaleString(undefined, options);

    // Container for each event
    let eventContainerDiv = document.createElement('div');
    eventContainerDiv.className = "eventDisplay";

    // Inner metadata
    let eventStatusDiv = document.createElement('div');
    eventStatusDiv.className = "eventStatus";
    let eventNameDiv = document.createElement('div');
    eventNameDiv.className = "eventName";
    let eventTimeUntilDiv = document.createElement('div');
    eventTimeUntilDiv.className = "timeUntilEvent";

    // Add those to the container
    eventContainerDiv.appendChild(eventStatusDiv);
    eventContainerDiv.appendChild(eventNameDiv);
    eventContainerDiv.appendChild(eventTimeUntilDiv);

    eventNameDiv.innerHTML =
      "<b>" +
      pvfmEvent.name +
      '</b> <br /><i class="eventPresentedBy">presented by ' +
      pvfmEvent.host +
      "</i>";

    eventTimeUntilDiv.innerHTML =
      localTimeScheduled +
      "<br/>" +
      "Starts in " +
      hoursLeft +
      " hours " +
      minutesLeft +
      " minutes";

    // Has the event started yet?
    if (timeDiffMs > 0) {
      // Event has not started

      // cap events displayed
      if (currentEventIndex <= 4) modalElement.appendChild(eventContainerDiv);

    } else {
      if (timeEndDiffMs > 0) {
        // Event is live

      } else {
        // Event has passed
        // Do nothing
      }
    }

    currentEventIndex++;

    console.log(pvfmEvent);
  }

  mui.overlay('on', modalElement);
}


// calculate and print remaining time until the event
function calculateTimeUntilEvent(show) {
  const eventDate = new Date(show.start_unix * 1000);
  const eventEndDate = new Date(show.end_unix * 1000);

  // Get the current date and time
  const now = new Date();

  // Calculate the difference in milliseconds
  const timeDiffMs = eventDate - now;
  const timeEndDiffMs = eventEndDate - now;

  // Has the event started yet?
  if (timeDiffMs > 0) {
    // Event has not started
    eventStatus.innerHTML = "Next event on PVFM:";
    eventStatus.style.color = "rgba(255, 255, 255, 0.7)";
    // Convert the difference to hours and minutes
    const hoursLeft = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const minutesLeft = Math.floor(
      (timeDiffMs % (1000 * 60 * 60)) / (1000 * 60)
    );

    // Format options for time display
    const options = {
      timeZoneName: "short",
      hour: "numeric",
      minute: "numeric",
      day: "numeric",
      month: "short",
    };
    const localTimeScheduled = eventDate.toLocaleString(undefined, options);

    console.log(
      `Time left until ${localTimeScheduled} "${show.name}": ${hoursLeft} hours and ${minutesLeft} minutes`
    );

    timeUntilEvent.hidden = false;
    timeUntilEvent.innerHTML =
      localTimeScheduled +
      "<br/>" +
      "Starts in " +
      hoursLeft +
      " hours " +
      minutesLeft +
      " minutes";

    // Should this be calculated independently from the metadata update?
  } else {
    if (timeEndDiffMs > 0) {
      // Event is live
      eventStatus.innerHTML = "<b>LIVE NOW ON PVFM</b>";
      eventStatus.style.color = "yellow"
      timeUntilEvent.innerHTML = "";
      console.log(`The event "${show.name}" is live!`);
    } else {
      // Event has passed
      console.log(`The event "${show.name}" is over.`);
      fetchSchedule();
    }
  }
}

// No scrolling or zooming
function disableScrollAndZoom() {
  const contentElement = document.querySelector(".inner");
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const contentWidth = contentElement.scrollWidth;
  const contentHeight = contentElement.scrollHeight;

  // Disable scroll and zoom only if the content fits
  if (contentWidth <= viewportWidth && contentHeight <= viewportHeight) {
    document.body.style.overflow = "hidden";

    // Add touch listeners to prevent zoom and scroll
    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("wheel", preventZoom, { passive: false });
  } else {
    // Enable scroll if the content does not fit
    document.body.style.overflow = "auto";

    // Remove event listeners to allow zoom and scroll
    document.removeEventListener("touchstart", preventZoom);
    document.removeEventListener("touchmove", preventScroll);
    document.removeEventListener("wheel", preventZoom);
  }
}

// No zooming
function preventZoom(e) {
  if (e.touches != undefined) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }
}

// Prevent scroll only outside of slider elements
function preventScroll(e) {
  if (document.getElementById("historyModal") == null) {
    const isSlider = e.target.closest(".slider");
    if (!isSlider) {
      e.preventDefault();
    }
  } else {
    document.body.style.overflow = "auto";
  }
}

// Run the function on page load and resize
window.addEventListener("resize", disableScrollAndZoom);
window.addEventListener("mui.overlay.off", disableScrollAndZoom);

window.onload = () => {
  disableScrollAndZoom();
  audio = new Audio(stream_url);
  audio.preload = "none";
};

// Run the fetch schedule function
fetchSchedule();

// Call the function initially
fetchSongDetails();

// Set up the interval to call the function every 20 seconds
// TODO: Make this adjustable
setInterval(fetchSongDetails, 20000);
