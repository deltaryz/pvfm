// PonyvilleFM Web Interface & Mobile App
// Created by deltaryz

console.log("Testing git pull");

// This represents the current selected stream
// Default is MP3 320 (Best Quality)
let stream_url = "https://dj.bronyradio.com/streamhq.mp3";

const streamUrls = {
  "Best Quality - MP3 320": {
    url: "https://dj.bronyradio.com/streamhq.mp3",
    albumText: "PonyvilleFM",
    albumart: "./pvfm1.png",
  },
  "Good Quality - Opus VBR": {
    url: "https://dj.bronyradio.com/pvfmopus.ogg",
    albumText: "PonyvilleFM",
    albumart: "./pvfm1.png",
  },
  "Okay Quality - Vorbis 112": {
    url: "https://dj.bronyradio.com/pvfm1.ogg",
    albumText: "PonyvilleFM",
    albumart: "./pvfm1.png",
  },
  "Low Quality - AAC+ 64": {
    url: "https://dj.bronyradio.com/pvfm1mobile.aac",
    albumText: "PonyvilleFM",
    albumart: "./pvfm1.png",
  },
  "PVFM3 No DJs - MP3 128": {
    url: "https://dj.bronyradio.com/pvfmfree.mp3",
    albumText: "PonyvilleFM No DJs",
    albumart: "./pvfm3.png",
  },
  "PVFM3 No DJs - Vorbis 112": {
    url: "https://dj.bronyradio.com/pvfmfree.ogg",
    albumText: "PonyvilleFM No DJs",
    albumart: "./pvfm3.png",
  },
  "Luna Radio - MP3 128": {
    url: "https://luna.ponyvillefm.com/listen/lunaradio/radio.mp3",
    albumText: "Luna Radio",
    albumart: "./lunaradio.png",
  },
};

// We will manipulate these throughout operation of the program
let schedule;
let audio;
let isPlaying = false;

// Metadata for currently playing song
let songDetails = {
  artist: "",
  title: "",
  albumArt: "",
  listeners: "",
};

// TODO: these should be inside an object or something this is a mess
const playPauseButton = document.getElementById("playPauseButton");
const resetButton = document.getElementById("resetButton");
const volumeControl = document.getElementById("volumeControl");
const artistField = document.getElementById("artist");
const titleField = document.getElementById("title");
const listenersField = document.getElementById("listeners");
const streamSelector = document.getElementById("streamSelector");
const installPWAButton = document.getElementById("installPWA");
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
  // TODO: Show Google Play listing instead
  if (!window.matchMedia("(display-mode: standalone)").matches)
    installPWAButton.hidden = false;
});

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

// Create the stream selector
const selectElement = document.createElement("select");
selectElement.id = "select";

// Populate the <select> with options from streamUrls
// ^ does that require a GDPR notice?
for (const [name, data] of Object.entries(streamUrls)) {
  const option = document.createElement("option");
  option.value = data.url;
  option.textContent = name;
  selectElement.appendChild(option);
}

// Add the <select> to the streamSelector <div>
streamSelector.appendChild(selectElement);

// Change stream and update dropdown with index (DOES NOT RESET/START PLAYING)
let changeStream = function (index) {
  const selectedOption = selectElement.options[index];

  selectElement.selectedIndex = index;

  console.log(
    `Selected: ${selectedOption.text}\n\nSaving to settings:\n` + index
  );

  // save to localStorage
  localStorage.setItem("stream", index);

  stopStreaming();

  // update stream_url variable
  stream_url = selectedOption.value;
};

// Check settings
// TODO: make this less shit this is a mess
let settings_stream = localStorage.getItem("stream");
let settings_volume = localStorage.getItem("volume");

// Set stream switcher to saved value if present
if (settings_stream) {
  console.log("Saved stream setting is present:\n" + settings_stream);
  changeStream(settings_stream);
}

console.log("Stream URL: " + stream_url);

// set volume to saved value if present
if (settings_volume) {
  console.log("Saved volume setting is present:\n" + settings_volume);
  if (audio != undefined) audio.volume = settings_volume;
  volumeControl.value = settings_volume * 100;
}

// Listen for changes in the <select> (when a new option is selected)
selectElement.addEventListener("change", function () {
  changeStream(selectElement.selectedIndex);
  resetStream();
});

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
  }
  isPlaying = !isPlaying;
  updateButtonText();
  updateMediaSession();
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
  console.log("Reset");
  stopStreaming();

  audio = new Audio(stream_url);

  resetButton.innerHTML = "Loading...";

  console.log("Resetting stream - " + stream_url);

  // Ensure the audio stream plays after it is loaded
  audio.addEventListener("canplay", () => {
    console.log("Audio can play, starting playback.");
    audio.play().catch((error) => {
      console.error("Error starting audio:", error);
      // TODO: Show error on page
    });
    isPlaying = true;
    fetchSongDetails();
    updateButtonText();
    resetButton.innerHTML = "↻ Reset Stream";
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
    let currentStream =
      streamUrls[selectElement.options[selectElement.selectedIndex].text];

    let response;
    let data;

    // This was for the separate luna radio metadata endpoint when HTTPS was broken
    // PVFM seems to get this fine now?

    // // override with lunaradio if that's what we're hearing
    // if (currentStream.albumText == "Luna Radio") {
    //   // We are listening to Luna Radio
    //   console.log("We are listening to Luna Radio");

    //   // Pull luna metadata
    //   response = await fetch(
    //     "https://luna.deltaryz.com" // Doing this myself until sleepy fixes the SSL
    //   );
    //   data = await response.json();
    //   nowPlayingData = data.now_playing.song || {};

    //   // Populate local metadata
    //   songDetails.listeners = data.listeners.current || "";
    //   songDetails.artist = nowPlayingData.artist || "";
    //   songDetails.title = nowPlayingData.title || "";
    // } else {
    //   // We are listening to PVFM
    //   console.log("We are listening to PVFM");

    // Pull pvfm metadata
    response = await fetch("https://ponyvillefm.com/data/nowplaying");
    data = await response.json();

    nowPlayingData = data.one || {}; // TODO: PVFM2/3 metadata
    if (currentStream.albumText == "Luna Radio")
      nowPlayingData = data.lunaradio || {};

    // Populate local metadata
    songDetails.listeners = nowPlayingData.listeners || "";
    songDetails.artist = nowPlayingData.artist || "";
    songDetails.title = nowPlayingData.title || "";

    songDetails.album = currentStream.albumText; // Use album name associated with URL
    songDetails.albumArt = currentStream.albumart; // Use album art associated with URL

    // Update page
    artistField.innerHTML = songDetails.artist;
    titleField.innerHTML = songDetails.title;
    listenersField.innerHTML = "Listeners: " + songDetails.listeners;

    if (songDetails.listeners == 0) listenersField.innerHTML = ""; // ssshhhh

    // Display time until upcoming event
    if (schedule != undefined) calculateTimeUntilEvent(schedule[0]);

    // Update media controls
    updateMediaSession();

    console.log("Updated song details:", songDetails);
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
        firstEvent.name +
        '</b> <br /><i style="font-size: 12px; color: rgba(255, 255, 255, 0.5);">presented by ' +
        firstEvent.host +
        "</i>";
    } else {
      console.log("No schedule entries found");
    }
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
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
    // No
    eventStatus.innerHTML = "Next event on PVFM:";
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
      // Event has started
      eventStatus.innerHTML = "<b>LIVE NOW</b>";
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
  const isSlider = e.target.closest(".slider");
  if (!isSlider) {
    e.preventDefault();
  }
}

// Run the function on page load and resize
window.addEventListener("resize", disableScrollAndZoom);

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
