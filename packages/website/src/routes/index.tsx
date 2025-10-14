import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Home } from '../pages/Home'
import { Promotions } from '../pages/Promotions'
import { Profile } from '../pages/Profile'
import { Settings } from '../pages/Settings'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { NotFound } from '../pages/NotFound'

export function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/promocoes" element={<Promotions />} />
			<Route path="/login" element={<Login />} />
			<Route path="/registro" element={<Register />} />
			<Route path="/perfil" element={<Profile />} />
			<Route path="/configuracoes" element={<Settings />} />
			<Route path="*" element={<NotFound />} />
		</Routes>
	)
}