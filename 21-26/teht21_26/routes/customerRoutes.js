var express = require('express');
var app = express();
var router = express.Router();

let ctrl = require('../controllers/customerController');

// HUOM! Tässä on vain esimerkin vuoksi määritelty erilaisia reittejä, toisessa on /api, toisessa ei
// Tähän ei liity mitään mystiikkaa, otettu mukaan vain esimerkin vuoksi.
 
router.route('/Asiakas').
    get(ctrl.fetch);

router.route('/api/studenttype').
    get(ctrl.fetchTypes);

router.route('/api/asiakas')
    .get(ctrl.fetchCustomersWithOrderInfo);

router.route('/api/tilaus/:asiakasid')
    .get(ctrl.fetchOrdersAndRowsByCustomerId);

router.route('/api/tilaus')
    .post(ctrl.addOrderWithRows);

router.route('/api/asiakas/:id')
    .delete(ctrl.deleteCustomer);

router.route('/api/tilausrivi/:tilausid')
    .put(ctrl.updateOrderRows);

// Julkaistaan ao. funktiot tämän js-filun ulkopuolelle
module.exports = router;