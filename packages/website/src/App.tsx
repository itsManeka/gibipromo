import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { AppRoutes } from './routes'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { NotificationProvider } from './contexts/NotificationContext'

function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<ProfileProvider>
					<NotificationProvider>
						<BrowserRouter>
							<AppLayout>
								<AppRoutes />
							</AppLayout>
						</BrowserRouter>
					</NotificationProvider>
				</ProfileProvider>
			</AuthProvider>
		</ThemeProvider>
	)
}

export default App