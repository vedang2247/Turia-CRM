import { configureStore } from '@reduxjs/toolkit';
import agentReducer from './agentSlice';
import tasksReducer from './tasksSlice';
import templatesReducer from './templatesSlice';
import connectionsReducer from './connectionsSlice';
import whatsappReducer from './whatsappSlice';
import emailReducer from './emailSlice';

export const store = configureStore({
  reducer: {
    agents: agentReducer,
    tasks: tasksReducer,
    templates: templatesReducer,
    connections: connectionsReducer,
    whatsapp: whatsappReducer,
    email: emailReducer,
  },
});
