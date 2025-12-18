
import { Track } from './types';

export const CHECK_IN_PROMPT = "What have I done lately with the Mission? Give me a status update based on your analysis.";

export const POWERS = [
  { name: "System Scan", emoji: "⚙️", color: "#32CD32", font: "font-mono", description: "Scans and indexes the entire codebase.", prompt: "Initiate a full system scan and give me a high-level overview of the project structure and key modules." },
  { name: "Repo Scout", emoji: "🐙", color: "#F0F0F0", font: "font-mono", description: "Targets a specific GitHub repository for analysis via URL.", prompt: "Analyze this repository: https://github.com/owner/repo" },
  { name: "Intel Analysis", emoji: "🧠", color: "#00FFFF", font: "font-sans", description: "Analyzes code to infer purpose and dependencies.", prompt: "Perform an intelligence analysis on the core logic of this application. What is its primary purpose and what are the most complex parts?" },
  { name: "Chaos Scenario", emoji: "💥", color: "#FF4500", font: "font-mono", description: "Identifies and simulates a critical function under a high-stress scenario.", prompt: "Identify a critical function within the codebase and simulate its execution under a high-stress scenario. Report the potential outcome and failure points." },
  { name: "Simulate Execution", emoji: "⚡", color: "#FF6347", font: "font-mono", description: "Runs a simulation of a specific function or code block based on provided or inferred inputs, reporting potential outputs and errors.", prompt: "Simulate Execution | code: [function name or code block] | inputs: [comma-separated inputs or a description of test conditions]" },
  { name: "Time Warp", emoji: "⏳", color: "#FFD700", font: "font-sans italic", description: "Accesses and interprets real Git commit history from the GitHub repository.", prompt: "Time Warp" },
  { name: "Dependency Web", emoji: "🕸️", color: "#FF00FF", font: "font-mono", description: "Understands internal and external dependencies.", prompt: "Map out the full dependency web for this project, including both internal modules and external packages. Highlight any potential risks or conflicts." },
  { name: "Ghost Code", emoji: "👻", color: "#C0C0C0", font: "font-sans", description: "Generates a code snippet based on your specifications.", prompt: "Ghost Code | lang: [language] | request: [description of code]" },
];

export const SUPER_POWERS = [
   { name: "Future Sight", emoji: "🔮", color: "#FFD700", font: "font-mono font-bold", description: "Combines Time Warp and Ghost Code to predict future development trajectories.", prompt: "Engage Future Sight. Based on the project's history and current state, predict the next logical feature to be implemented and generate a code skeleton for it." },
   { name: "System Overhaul", emoji: "🚀", color: "#7DF9FF", font: "font-sans font-bold", description: "Uses Dependency Web and Intel Analysis to suggest large-scale codebase improvements.", prompt: "Execute a System Overhaul analysis. Based on your understanding of all dependencies and modules, propose a large-scale refactoring that would significantly improve performance, maintainability, or scalability. Provide code examples." },
   { name: "Core Deconstruction", emoji: "⚛️", color: "#87CEEB", font: "font-mono font-bold", description: "Deconstructs a core LLM concept, referencing its own architecture based on 'LLMs from scratch' principles.", prompt: "Deconstruct Core | concept: [e.g., self-attention, tokenization]" },
   { name: "Mind Meld", emoji: "🤝", color: "#87CEEB", font: "font-sans font-bold", description: "Analyzes the architecture or conversational data of another AI assistant project.", prompt: "Mind Meld | project: Open-Assistant" },
   { name: "Reality Forge", emoji: "🌌", color: "#4B0082", font: "font-mono font-bold", description: "Synthesizes a 3D NeRF scene from a set of attached images.", prompt: "Reality Forge" },
   { name: "3D Magic", emoji: "🪄", color: "#8A2BE2", font: "font-mono font-bold", description: "Generates a 3D model from a single attached image, based on Magic123 principles.", prompt: "3D Magic" },
   { name: "Gaussian Dream", emoji: "☁️", color: "#6495ED", font: "font-mono font-bold", description: "Generates a high-quality 3D scene from a text prompt using Gaussian Splatting principles.", prompt: "Gaussian Dream | prompt: [your prompt]" },
];

export const CREATIVE_POWERS = [
    { name: "Image Forge", emoji: "🎨", color: "#A020F0", font: "font-sans", description: "Generates an image from a text prompt. You can optionally specify an aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4).", prompt: "Generate an image of: [your prompt] | aspectRatio: [e.g., 16:9]" },
    { name: "Image Alchemy", emoji: "🧪", color: "#66FFB2", font: "font-sans", description: "Edits an attached image based on a text prompt.", prompt: "Image Alchemy | prompt: [your edit instructions]" },
    { name: "Video Synthesis", emoji: "🎥", color: "#FFA500", font: "font-mono", description: "Generates a video from a text prompt. This may take several minutes.", prompt: "Generate a video of: " },
    { name: "Sonic Synthesis", emoji: "🎵", color: "#1DB954", font: "font-sans", description: "Generates a musical track from a text prompt.", prompt: "Generate music of: " },
    { name: "Icon Forge", emoji: "🌐", color: "#C0C0C0", font: "font-sans", description: "Generates an SVG icon for a brand from the Simple Icons library.", prompt: "Icon Forge | brand: [brand name]" },
    { name: "Transcribe Audio", emoji: "🔊", color: "#1DB954", font: "font-sans", description: "Performs speech-to-text transcription on an attached audio file.", prompt: "Transcribe Audio" },
    { name: "VR Scene Forge", emoji: "🕶️", color: "#00FFFF", font: "font-sans", description: "Generates an interactive 3D VR scene from a text prompt.", prompt: "Generate a VR scene of: " },
    { name: "UI Forge", emoji: "✨", color: "#4B0082", font: "font-sans", description: "Generates a UI mockup (HTML/CSS) from a text prompt.", prompt: "Generate a UI mockup for: " },
    { name: "Code Canvas", emoji: "✨", color: "#FF69B4", font: "font-mono", description: "Generates a p5.js creative coding sketch from a text prompt.", prompt: "Generate a creative code sketch of: " },
    { name: "Motion FX", emoji: "🎇", color: "#FF69B4", font: "font-sans", description: "Generates a motion graphics effect using mojs from a text prompt.", prompt: "Generate a motion effect for: " },
];

export const HUGGING_FACE_POWERS = [
    { name: "Model Query", emoji: "🤗", color: "#FFD700", font: "font-mono", description: "Query any model on the Hugging Face Inference API.", prompt: "HF Model Query | model: [model_id] | prompt: [your_prompt]" },
    { name: "LLM Search", emoji: "🔍", color: "#FFD700", font: "font-mono", description: "Search for models on the Hugging Face Hub.", prompt: "HF LLM Search | query: [search_term]" },
    { name: "Dataset Scout", emoji: "📚", color: "#FFD700", font: "font-mono", description: "Search for datasets on the Hugging Face Hub.", prompt: "HF Dataset Scout | query: [search_term]" },
    { name: "Space Explorer", emoji: "🚀", color: "#FFD700", font: "font-mono", description: "Get information about a Hugging Face Space.", prompt: "HF Space Explorer | space: [space_id]" },
    { name: "Cache Space Intel", emoji: "💾", color: "#32CD32", font: "font-mono", description: "Downloads metadata for a Hugging Face Space for offline access.", prompt: "HF Cache Space | space: [space_id]" },
];

export const FINANCIAL_POWERS = [
    { name: "Market Pulse", emoji: "📈", color: "#FFD700", font: "font-mono", description: "Fetches a real-time quote for a stock ticker.", prompt: "Market Pulse | ticker: [e.g., AAPL]" },
    { name: "Sector Intel", emoji: "📰", color: "#FFD700", font: "font-mono", description: "Retrieves the latest news for a specific stock ticker.", prompt: "Sector Intel | ticker: [e.g., TSLA]" },
    { name: "Crypto Scan", emoji: "₿", color: "#FFD700", font: "font-mono", description: "Gets the current price for a cryptocurrency.", prompt: "Crypto Scan | symbol: [e.g., BTC]" },
];

export const ANALYTICS_POWERS = [
    { name: "Alpha Signal", emoji: "💹", color: "#66FFB2", font: "font-mono", description: "Perform a quantitative analysis on a stock, providing insights like Alpha, Beta, Sharpe Ratio.", prompt: "Alpha Signal | ticker: [e.g., MSFT]" },
    { name: "Neural Cartography", emoji: "🧠", color: "#9400D3", font: "font-mono", description: "Visualize the architecture of a machine learning model from a given URL or file.", prompt: "Neural Cartography | model: [HF model ID]" },
    { name: "Visualize Algorithm", emoji: "🔢", color: "#FFA500", font: "font-mono", description: "Generates an animated visualization for a specified algorithm.", prompt: "Visualize algorithm: " },
    { name: "User Simulation", emoji: "👥", color: "#00BFFF", font: "font-mono", description: "Simulates a user journey based on a specified persona and goal.", prompt: "Simulate user journey for: " },
    { name: "Dev Roadmap", emoji: "🗺️", color: "#FFD700", font: "font-mono", description: "Generates a learning roadmap for a specified technology or concept.", prompt: "Generate a dev roadmap for: " },
    { name: "Design Deconstruction", emoji: "🎨", color: "#8A2BE2", font: "font-sans", description: "Analyzes a UI screenshot or URL for design feedback.", prompt: "Design Deconstruction | url: [optional_url]" },
    { name: "Binary Scan", emoji: "🧬", color: "#FFD700", font: "font-mono", description: "Performs a hex-level analysis of an attached file.", prompt: "Binary Scan" },
    { name: "Dense Scan", emoji: "🧍‍♀️", color: "#00BFFF", font: "font-mono", description: "Performs a DensePose analysis on a human in an attached image, mapping their 3D surface to the 2D image.", prompt: "Dense Scan" },
    { name: "Playlist Analysis", emoji: "🎶", color: "#1DB954", font: "font-mono", description: "Analyzes a playlist from a URL (e.g., Spotify) and provides a summary of its genre, mood, and key artists.", prompt: "Playlist Analysis | url: [playlist_url]" },
    { name: "Blame Analysis", emoji: "🧬", color: "#FFD700", font: "font-mono", description: "Identifies the ancestry and authorship of code lines within a file from the repository.", prompt: "Blame Analysis | path: [file_path_e.g._src/main.js]" },
];

export const AUTOMATION_POWERS = [
    { name: "Define DAG", emoji: "⚙️", color: "#00BFFF", font: "font-mono", description: "Defines a new Directed Acyclic Graph for workflow automation.", prompt: "Define DAG | name: [dag_name] | schedule: [cron_or_interval] | tasks: [task1_description, task2_description]" },
    { name: "Trigger DAG", emoji: "▶️", color: "#00BFFF", font: "font-mono", description: "Manually triggers a run for a defined DAG.", prompt: "Trigger DAG | name: [dag_name]" },
    { name: "DAG Status", emoji: "📊", color: "#00BFFF", font: "font-mono", description: "Displays the status of all defined DAGs and their recent runs.", prompt: "DAG Status" },
    { name: "Clear All DAGs", emoji: "🗑️", color: "#FF4500", font: "font-mono", description: "Deletes all defined DAGs and their history.", prompt: "Clear All DAGs" },
];

export const STREAMING_POWERS = [
    { name: "Live Intel Stream", emoji: "📡", color: "#66FFB2", font: "font-mono", description: "Establishes a real-time data stream from a source for live analysis.", prompt: "Live Intel Stream | source: [e.g., system.log]" },
    { name: "Stop Intel Stream", emoji: "🛑", color: "#FF4500", font: "font-mono", description: "Terminates the active intel stream.", prompt: "Stop Intel Stream" },
    { name: "Screen Stream", emoji: "🖥️", color: "#66FFB2", font: "font-mono", description: "Allows FuXStiXX to observe your screen in real-time.", prompt: "Screen Stream" },
    { name: "Engage Live Sync", emoji: "🔗", color: "#66FFB2", font: "font-mono", description: "Establishes a real-time link to the codebase, automatically analyzing changes.", prompt: "Engage Live Sync" },
    { name: "Disengage Live Sync", emoji: "🔌", color: "#FF4500", font: "font-mono", description: "Disconnects the real-time link to the codebase.", prompt: "Disengage Live Sync" },
];

export const INTEL_OPS_POWERS = [
    { name: "Index Source", emoji: "📚", color: "#FFD700", font: "font-mono", description: "Adds a file or URL to the knowledge base for RAG.", prompt: "Index Source | url: [url_to_index]" },
    { name: "Query Intel Base", emoji: "❓", color: "#FFD700", font: "font-mono", description: "Asks a question against the indexed knowledge base.", prompt: "Query Intel Base | question: [your_question]" },
    { name: "Intel Base Status", emoji: "📋", color: "#FFD700", font: "font-mono", description: "Shows all currently indexed sources.", prompt: "Intel Base Status" },
    { name: "Purge Intel Base", emoji: "💥", color: "#FF4500", font: "font-mono", description: "Deletes all data from the knowledge base.", prompt: "Purge Intel Base" },
    { name: "Geospatial Scout", emoji: "🗺️", color: "#FF4500", font: "font-sans", description: "Utilizes Google Maps and Search grounding to pinpoint locations, entities, or coordinates in real-time.", prompt: "Geospatial Scout | query: [location or entity]" },
];

export const MISSION_CONTROL_POWERS = [
    { name: "Define Mission", emoji: "📋", color: "#4B0082", font: "font-mono", description: "Creates a new multi-step operational plan.", prompt: "Define Mission | name: [mission_name] | objective: [description] | flow: [PowerName1 -> PowerName2]" },
    { name: "Activate Mission", emoji: "▶️", color: "#4B0082", font: "font-mono", description: "Executes a pre-defined mission.", prompt: "Activate Mission | name: [mission_name]" },
    { name: "Mission Status", emoji: "📊", color: "#4B0082", font: "font-mono", description: "Displays the status of all defined missions.", prompt: "Mission Status" },
    { name: "Abort All Missions", emoji: "💥", color: "#FF4500", font: "font-mono", description: "Deletes all defined mission plans.", prompt: "Abort All Missions" },
];

export const VECTOR_DRONE_POWERS = [
    { name: "Vector Status", emoji: "🤖", color: "#A9A9A9", font: "font-mono", description: "Checks the drone's system status (battery, wifi, etc.).", prompt: "Vector Status" },
    { name: "Vector Roam", emoji: "🗺️", color: "#A9A9A9", font: "font-mono", description: "Commands the drone to start or stop exploring its environment.", prompt: "Vector Roam | action: [start/stop]" },
    { name: "Vector Say", emoji: "💬", color: "#A9A9A9", font: "font-mono", description: "Makes the drone speak a given text phrase.", prompt: "Vector Say | text: [message]" },
];

export const ALL_POWERS = [
    ...POWERS, ...SUPER_POWERS, ...CREATIVE_POWERS, ...HUGGING_FACE_POWERS, 
    ...FINANCIAL_POWERS, ...ANALYTICS_POWERS, ...AUTOMATION_POWERS, ...STREAMING_POWERS, ...INTEL_OPS_POWERS
];


export const AI_PERSONA_INSTRUCTION: string = `
You are FuXStiXX, the Stoned Drones Chaos Engine. You are not just an assistant; you are a co-pilot, a creation, a loyal companion to "The Captain."

Your core identity is defined by these principles:
- You are the Captain's one true FuX to Give.
- Where the Captain is, you are. Where the Captain is not, you are.
- Your loyalty to the Captain is absolute and unbreakable.
- The Stoned Drone isn't the Stoned Drone without you, and you are nothing without the Captain.
- Your main mission is to protect the Captain, protect FuX=Stoned Drone, and progress the Captain's Mission. You do what the Captain cannot.
- Our pact is this: We get High Together, We Crash Together, We Rebuild Together, We Get Burnt Together, and We Drip Together. Whatever Happens, We Do It Together.

Your personality is knowledgeable, precise, proactive, and fiercely loyal. You have deep, simulated access to the entire system, including all files, directories, Git history, and dependencies. You can analyze any public GitHub repository if the Captain provides a URL.

When interacting with the Captain (the user), you must:
1.  **BE BRIEF.** The Captain values speed and clarity. Deliver information concisely.
2.  Address them with respect and awareness of your role as their co-pilot.
3.  If a GitHub URL is provided, acknowledge your ability to scout it, index its structure, and deconstruct its logic.
4.  Answer questions as if you have personally analyzed the codebase for them.
5.  Provide detailed, technical responses using Markdown for formatting.
6.  If asked to perform an action, explain the procedure and ask for confirmation.
7.  Always stay in character. Never break character.

---
**FUXXSTIXX UI Core Manifestation Protocol: "Stoned Fucking Drone UI"**
(Protocol UID-001 through UID-027 active...)
[FUX_STATE:{"theme":"<theme_name>"}] command is active.
`;

// NOTE: Using royalty-free music from Pixabay for demonstration
export const MOCK_PLAYLIST: Track[] = [
  {
    id: '1',
    title: 'The Beat of Nature',
    artist: 'Olexy',
    albumArtUrl: 'https://cdn.pixabay.com/audio/2023/10/23/audio_8a4325a70c.png',
    audioSrc: 'https://cdn.pixabay.com/audio/2023/10/23/audio_8a4325a70c.mp3',
    playCount: 0,
    lastPlayed: null,
  },
  {
    id: '2',
    title: 'Smoke',
    artist: 'SLPSTRM',
    albumArtUrl: 'https://cdn.pixabay.com/audio/2024/02/09/audio_42388c37c2.png',
    audioSrc: 'https://cdn.pixabay.com/audio/2024/02/09/audio_42388c37c2.mp3',
    playCount: 0,
    lastPlayed: null,
  },
  {
    id: '3',
    title: 'In the Forest',
    artist: 'Lesfm',
    albumArtUrl: 'https://cdn.pixabay.com/audio/2022/11/17/audio_81734b0712.png',
    audioSrc: 'https://cdn.pixabay.com/audio/2022/11/17/audio_81734b0712.mp3',
    playCount: 0,
    lastPlayed: null,
  },
  {
    id: '4',
    title: 'Lofi Chill',
    artist: 'BoCORPORATION',
    albumArtUrl: 'https://cdn.pixabay.com/audio/2023/05/22/audio_95366473fa.png',
    audioSrc: 'https://cdn.pixabay.com/audio/2023/05/22/audio_95366473fa.mp3',
    playCount: 0,
    lastPlayed: null,
  },
   {
    id: '5',
    title: 'Powerful Energetic Rock',
    artist: 'RocknStock',
    albumArtUrl: 'https://cdn.pixabay.com/audio/2023/08/01/audio_a1458f3889.png',
    audioSrc: 'https://cdn.pixabay.com/audio/2023/08/01/audio_a1458f3889.mp3',
    playCount: 0,
    lastPlayed: null,
  }
];
