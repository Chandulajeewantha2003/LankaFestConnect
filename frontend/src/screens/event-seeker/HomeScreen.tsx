import React from 'react';
import RoleDashboard from '../shared/RoleDashboard';
import { User } from '../../services/api';
export default function HomeScreen(props: { user: User; logout: () => void }) { return <RoleDashboard {...props}/>; }
