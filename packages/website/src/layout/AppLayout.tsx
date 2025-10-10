import React from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

interface AppLayoutProps {
	children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
	return (
		<div className="min-h-screen flex flex-col bg-dark-950 text-primary-white">
			<Header />
			<main className="flex-1">
				{children}
			</main>
			<Footer />
		</div>
	)
}