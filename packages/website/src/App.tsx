import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { AppRoutes } from './routes'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'

function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<BrowserRouter>
					<AppLayout>
						<AppRoutes />
					</AppLayout>
				</BrowserRouter>
			</AuthProvider>
		</ThemeProvider>
	)
}

export default App