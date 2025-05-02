// Controllers
const {
  createLiquidation,
  listLiquidations,
} = require('../controllers/liquidationController');
const {
  createVault,
  getVault,
  updateVault,
} = require('../controllers/vaultController');
const {
  lockCollateral,
  getLocks,
} = require('../controllers/lockController');
const {
  updateRate,
  getRate,
} = require('../controllers/irController');
const {
  mintDai,
  getDaiBalance,
} = require('../controllers/daiController');

// Liquidations
router.post('/liquidations', createLiquidation);
router.get('/liquidations', listLiquidations);

// Vaults
router.post('/vaults', createVault);
router.get('/vaults/:owner', getVault);
router.patch('/vaults/:id', updateVault);

// Locks
router.post('/locks', lockCollateral);
router.get('/locks/:user', getLocks);

// Interest Rate
router.post('/ir/update', updateRate);
router.get('/ir', getRate);

// DAI Minting
router.post('/dai/mint', mintDai);
router.get('/dai/:holder', getDaiBalance);

module.exports = router;