import { LoadingManager } from 'three'
import { GLTFLoader } from '../third-party/GLTFLoader.js';

import treeBranchedUrl from 'url:../../static/objects/tree/branched.gltf';
import treeOpenUrl from 'url:../../static/objects/tree/open.gltf';
import treePyramidalUrl from 'url:../../static/objects/tree/pyramidal.gltf';
import treeRoundUrl from 'url:../../static/objects/tree/round.gltf';
import treeSpreadingUrl from 'url:../../static/objects/tree/spreading.gltf';

import plainUrl from 'url:../../static/objects/street/plain.gltf';
import streetCurveUrl from 'url:../../static/objects/street/curve.gltf';
import streetStraightUrl from 'url:../../static/objects/street/straight.gltf';
import streetTCrossUrl from 'url:../../static/objects/street/t_cross.gltf';
import streetCrossUrl from 'url:../../static/objects/street/cross.gltf';
import accessoiresUrl from 'url:../../static/objects/street/accessoires.gltf';

import carUrl from 'url:../../static/objects/new/Car_combined.gltf';

import architectureHouseSimpleUrl from 'url:../../static/objects/architecture/house_simple.gltf';
import architectureHouseBungalowUrl from 'url:../../static/objects/architecture/house_bungalow.gltf';
import architectureHouseFlatUrl from 'url:../../static/objects/architecture/house_flat.gltf';
import architectureHouseDoubleUrl from 'url:../../static/objects/architecture/house_double.gltf';

import signUrl from 'url:../../static/objects/sign/signs.gltf';

const MODELS = {
  treeBranched: treeBranchedUrl,
  treeOpen: treeOpenUrl,
  treePyramidal: treePyramidalUrl,
  treeRound: treeRoundUrl,
  treeSpreading: treeSpreadingUrl,

  streetPlain: plainUrl,
  streetCurve: streetCurveUrl,
  streetStraight: streetStraightUrl,
  streetTCross: streetTCrossUrl,
  streetCross: streetCrossUrl,

  accessoires: accessoiresUrl,

  car: carUrl,

  architectureHouseSimple: architectureHouseSimpleUrl,
  architectureHouseBungalow: architectureHouseBungalowUrl,
  architectureHouseFlat: architectureHouseFlatUrl,
  architectureHouseDouble: architectureHouseDoubleUrl,

  sign: signUrl
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
      .load(path, (gltf) => {
        loadedModels[name] = gltf.scene;
      }, null, err => console.error(err));
  }
}