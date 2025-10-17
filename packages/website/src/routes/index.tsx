import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { Home } from '../pages/Home'
import { Promotions } from '../pages/Promotions'
import { Profile } from '../pages/Profile'
import { Settings } from '../pages/Settings'
import { AddProducts } from '../pages/AddProducts'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { NotFound } from '../pages/NotFound'

export function AppRoutes() {
	return (
		<Routes>
			{/* Rotas públicas */}
			<Route path="/" element={<Home />} />
			<Route path="/login" element={<Login />} />
			<Route path="/registro" element={<Register />} />
			<Route path="/promocoes" element={<Promotions />} />

			{/* Rotas protegidas */}
			<Route
				path="/perfil"
				element={
					<ProtectedRoute>
						<Profile />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/adicionar-produtos"
				element={
					<ProtectedRoute>
						<AddProducts />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/configuracoes"
				element={
					<ProtectedRoute>
						<Settings />
					</ProtectedRoute>
				}
			/>

			{/* 404 */}
			<Route path="*" element={<NotFound />} />
		</Routes>
	)
}