import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { AppRoutes } from './routes'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
	return (
		<ThemeProvider>
			<BrowserRouter>
				<AppLayout>
					<AppRoutes />
				</AppLayout>
			</BrowserRouter>
		</ThemeProvider>
	)
}

export default App