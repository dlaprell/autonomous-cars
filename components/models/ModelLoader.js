import { LoadingManager } from 'three'
import { GLTFLoader } from '../third-party/GLTFLoader.js';

const MODELS = {
  treeBranched: 'tree/branched.gltf',
  treeOpen: 'tree/open.gltf',
  treePyramidal: 'tree/pyramidal.gltf',
  treeRound: 'tree/round.gltf',
  treeSpreading: 'tree/spreading.gltf',

  streetCurve: 'street/curve.gltf',
  streetStraight: 'street/straight.gltf',
  streetTSection: 'street/straight.gltf',

  carPurple: 'car/purple.gltf'
};

export default function loadModels({ onLoad, onProgress, onError }) {
  const loadedModels = {};
  
  const manager = new LoadingManager(
    function handleOnLoad() {
      onLoad(loadedModels);
    },
    onProgress,
    onError
  );

  for (const [ name, path ] of Object.entries(MODELS)) {
    loadedModels[name] = null;

    new GLTFLoader(manager)
      .load(`/objects/${path}`, (gltf) => {
        loadedModels[name] = gltf.scene;

        
      }, null, err => console.error(err));
  }
}