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
  streetTCross: 'street/t_cross.gltf',
  streetCross: 'street/cross.gltf',

  carPurple: 'car/purple.gltf',
  carTuerkis: 'car/tuerkis.gltf',
  carBase: 'car/base.gltf',
  carBaseMaterial: 'car/base_material.gltf',
  carBaseHuman: 'car/base_human_3.gltf',

  architectureHouseSimple: 'architecture/house_simple.gltf',
  architectureHouseBungalow: 'architecture/house_bungalow.gltf',
  architectureHouseFlat: 'architecture/house_flat.gltf',
  architectureHouseDouble: 'architecture/house_double.gltf',

  sign: 'sign/signs.gltf'
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