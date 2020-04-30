import { TextureLoader, RepeatWrapping, MeshLambertMaterial, Mesh, DoubleSide, PlaneGeometry } from 'three';

import { SimluationSceneElement } from './SimulationScene';

import imageGrassUrl from 'url:../static/images/grass.png';

class GridRenderer extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    const { grid } = this.props;
    this.group().add(grid.getGroup());
  }
}

class Ground extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    const grassTexture = new TextureLoader()
      .load(imageGrassUrl);

    grassTexture.wrapS = RepeatWrapping;
    grassTexture.wrapT = RepeatWrapping;
    grassTexture.offset.x = 90 / (2 * Math.PI);

    grassTexture.repeat.set(64, 64);

    this._grassMaterial = new MeshLambertMaterial({
      map: grassTexture,
      side: DoubleSide
    });
  }

  render() {
    const { grid } = this.props;

    if (grid.size() !== this._curGridSize) {
      if (this._curMesh) {
        this.group().remove(this._curMesh);
      }

      const groundMesh = new Mesh(
        new PlaneGeometry(grid.size(), grid.size(), 2, 2),
        this._grassMaterial
      );

      groundMesh.castShadow = false;
      groundMesh.receiveShadow = true;
      groundMesh.frustumCulled = false;

      groundMesh.calculateTilePosition = (x, y) => {
        return grid.computeTileFromPosition(x, y);
      }

      groundMesh.rotation.x = Math.PI / 2;
      this.group().add(groundMesh);

      groundMesh.position.y -= 0.1;

      this._curMesh = groundMesh;
      this._curGridSize = grid.size();
    }

    return super.render();
  }
}

export {
  GridRenderer,

  Ground
};