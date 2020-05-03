import { LoadingManager } from 'three'
import { GLTFLoader } from '../third-party/GLTFLoader.js';

import treeBranchedUrl from '../../static/objects/tree/branched.gltf';
import treeOpenUrl from '../../static/objects/tree/open.gltf';
import treePyramidalUrl from '../../static/objects/tree/pyramidal.gltf';
import treeRoundUrl from '../../static/objects/tree/round.gltf';
import treeSpreadingUrl from '../../static/objects/tree/spreading.gltf';

import plainUrl from '../../static/objects/street/plain.gltf';
import streetCurveUrl from '../../static/objects/street/curve.gltf';
import streetStraightUrl from '../../static/objects/street/straight.gltf';
import streetTCrossUrl from '../../static/objects/street/t_cross.gltf';
import streetCrossUrl from '../../static/objects/street/cross.gltf';
// import accessoiresUrl from '../../static/objects/street/accessoires.gltf';

import benchUrl from '../../static/objects/decoration/bench.gltf';
import trashcanUrl from '../../static/objects/decoration/trashcan.gltf';
import benchTargetUrl from '../../static/objects/decoration/bench_target.gltf';
import trashcanTargetUrl from '../../static/objects/decoration/trashcan_target.gltf';

import carUrl from '../../static/objects/car/standard.gltf';

import architectureHouseSimpleUrl from '../../static/objects/architecture/house_simple.gltf';
import architectureHouseBungalowUrl from '../../static/objects/architecture/house_bungalow.gltf';
import architectureHouseFlatUrl from '../../static/objects/architecture/house_flat.gltf';
import architectureHouseDoubleUrl from '../../static/objects/architecture/house_double.gltf';

import signUrl from '../../static/objects/sign/signs.gltf';

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

  // accessoires: accessoiresUrl,

  bench: benchUrl,
  benchTarget: benchTargetUrl,
  trashcan: trashcanUrl,
  trashcanTarget: trashcanTargetUrl,

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