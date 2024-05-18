const express = require('express');
const route = express.Router();

const { authenticateUser, authorizePermissions } = require('../middlewares/authentication');

const conversationApi = require('../apis/conversation.api');

// route.get('/:id', cateApi.getSingleCategory);
// route.patch('/:classifyId', authenticateUser, authorizePermissions('admin', 'vendor'), classifyApi.updateClassify);
// route.delete('/:classifyId', authenticateUser, authorizePermissions('admin', 'vendor'), classifyApi.deleteClassify);

route.post('/markAtRead/:converId', authenticateUser, conversationApi.markAtRead);
route.get('/message/:converId', authenticateUser, conversationApi.getConversationMessages);
route.get('/:converId', authenticateUser, conversationApi.getConversationDetails);
route.get('/', authenticateUser, conversationApi.getMyConversations);
route.post('/', authenticateUser, conversationApi.createConversation);

module.exports = route;
