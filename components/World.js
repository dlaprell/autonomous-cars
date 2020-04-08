import { TextureLoader, RepeatWrapping, MeshLambertMaterial, Mesh, DoubleSide, PlaneGeometry } from 'three';

import { SimluationSceneElement } from './SimulationScene';

class GridRenderer extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    const { grid } = this.props;

    grid.render();
    
    this.group().add(grid.getGroup());
  }
}

class Ground extends SimluationSceneElement {
  constructor(...args) {
    super(...args);

    const { grid } = this.props;

    const grassTexture = new TextureLoader().load('/images/grass.png');
    
    grassTexture.wrapS = RepeatWrapping; 
    grassTexture.wrapT = RepeatWrapping;
    grassTexture.offset.x = 90 / (2 * Math.PI);
  
    grassTexture.repeat.set(64, 64);
  
    const grassMaterial = new MeshLambertMaterial({
      map: grassTexture,
      side: DoubleSide
    });
  
    const groundMesh = new Mesh(
      new PlaneGeometry(grid.size(), grid.size(), 2, 2),
      grassMaterial
    );

    groundMesh.calculateTilePosition = (x, y) => {
      return grid.computeTileFromPosition(x, y);
    }
  
    groundMesh.rotation.x = Math.PI / 2;
    this.group().add(groundMesh);
  }
}

export {
  GridRenderer,

  Ground
};