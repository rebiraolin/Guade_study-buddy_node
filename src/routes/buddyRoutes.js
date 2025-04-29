const express = require('express');
const router = express.Router();
const buddyController = require('../controllers/buddyController');

// BuddyGroup endpoints
router.post('/groups', buddyController.createBuddyGroup);
router.get('/groups', buddyController.listBuddyGroups);
router.get('/groups/:groupId', buddyController.getBuddyGroupDetails);
router.post('/groups/:groupId/join', buddyController.joinBuddyGroup);
router.post('/groups/:groupId/invite', buddyController.inviteToBuddyGroup);
router.post('/groups/:groupId/request', buddyController.requestToJoinBuddyGroup);
router.get('/groups/:groupId/requests', buddyController.listBuddyGroupRequests);
router.post('/groups/:groupId/approve', buddyController.approveBuddyGroupRequest);
router.post('/groups/:groupId/decline', buddyController.declineBuddyGroupRequest);

router.get('/popular', buddyController.getPopularBuddies);
router.get('/my', buddyController.getMyBuddies);
router.get('/search', buddyController.searchBuddies);
router.get('/:userId', buddyController.getBuddyProfile);
router.get('/requests', buddyController.getBuddyRequests);

module.exports = router; 