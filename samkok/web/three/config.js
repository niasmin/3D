// User may explicitly choose offline mode; no credentials are stored here.
window.SAMKOK_3D_CONFIG={edition:'3d',online:(()=>{try{return localStorage.getItem('samkok-3d-offline')!=='1'}catch(_){return true}})()};
