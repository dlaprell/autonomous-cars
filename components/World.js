import { TextureLoader, RepeatWrapping, MeshLambertMaterial, Mesh, DoubleSide, FrontSide, PlaneGeometry, BackSide } from 'three';

import { SimulationSceneElement } from './SimulationScene';

import imageGrassUrl from 'url:../static/images/grass.png';

class GridRenderer extends SimulationSceneElement {
  constructor(...args) {
    super(...args);

    const { grid } = this.props;
    this.group().add(grid.getGroup());
  }
}

class Ground extends SimulationSceneElement {
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
      side: BackSide
    });
  }

  render() {
    const { grid } = this.props;

    if (grid.size() !== this._curGridSize) {
      if (this._curMesh) {
        this.group().remove(this._curMesh);
      }

      const geometry = new PlaneGeometry(grid.size(), grid.size(), 2, 2);
      // geometry.scale(-1, 1, 1);
      geometry.computeFaceNormals();

      const groundMesh = new Mesh(
        geometry,
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