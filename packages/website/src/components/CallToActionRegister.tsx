import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserPlus, Smartphone, Globe, Link2Icon, ArrowRight, Tag } from 'lucide-react'

/**
 * CTA para convidar visitantes a se registrarem
 * Explica a integração entre Site e Telegram Bot
 * Design: Segue padrão dark do site, sem gradientes chamativos
 */
export function CallToActionRegister() {
	const { isAuthenticated } = useAuth()

	return (
		<section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-900">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h2 className="text-3xl font-display font-bold text-white mb-4">
						Comece a Monitorar Agora
					</h2>
					<p className="text-primary-light text-lg">
						Escolha como quer acompanhar as promoções de seus quadrinhos, mangá ou livros favoritos: pelo site ou Telegram
					</p>
				</div>

				{/* Opções de Monitoramento */}
				<div className="grid md:grid-cols-2 gap-8 mb-12">
					{/* Site */}
					<div className="card">
						<div className="flex items-start gap-4 mb-4">
							<div className="bg-primary-yellow/100 p-3 rounded-xl flex-shrink-0">
								<Globe className="h-8 w-8 text-primary-dark" />
							</div>
							<div>
								<h3 className="text-xl font-bold text-white mb-2">Via Site</h3>
								<p className="text-dark-300 text-sm">
									Acesse de qualquer navegador e gerencie seus produtos
								</p>
							</div>
						</div>
						<ul className="space-y-3 mb-6">
							<li className="flex items-start gap-3 text-dark-300 text-sm">
								<div className="w-1.5 h-1.5 bg-primary-yellow/100 rounded-full mt-2 flex-shrink-0" />
								<span>Dashboard completo com todos os seus produtos</span>
							</li>
							<li className="flex items-start gap-3 text-dark-300 text-sm">
								<div className="w-1.5 h-1.5 bg-primary-yellow/100 rounded-full mt-2 flex-shrink-0" />
								<span>Visualize gráficos de histórico de preços</span>
							</li>
							<li className="flex items-start gap-3 text-dark-300 text-sm">
								<div className="w-1.5 h-1.5 bg-primary-yellow/100 rounded-full mt-2 flex-shrink-0" />
								<span>Configure alertas personalizados por produto</span>
							</li>
						</ul>
						<Link to={isAuthenticated ? "/promocoes" : "/login"} className="btn-primary w-full inline-flex items-center justify-center gap-2">
							{isAuthenticated ? <Tag className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
							<span>{isAuthenticated ? "Acessar Promoções" : "Fazer Login"}</span>
						</Link>
					</div>

					{/* Telegram */}
					<div className="card">
						<div className="flex items-start gap-4 mb-4">
							<div className="bg-primary-purple/100 p-3 rounded-xl flex-shrink-0">
								<Smartphone className="h-8 w-8 text-primary" />
							</div>
							<div>
								<h3 className="text-xl font-bold text-white mb-2">Via Telegram</h3>
								<p className="text-dark-300 text-sm">
									Receba notificações instantâneas no seu celular quando os preços caírem
								</p>
							</div>
						</div>
						<ul className="space-y-3 mb-6">
							<li className="flex items-start gap-3 text-dark-300 text-sm">
								<div className="w-1.5 h-1.5 bg-primary-purple/100 rounded-full mt-2 flex-shrink-0" />
								<span>Adicione produtos direto no chat do bot</span>
							</li>
							<li className="flex items-start gap-3 text-dark-300 text-sm">
								<div className="w-1.5 h-1.5 bg-primary-purple/100 rounded-full mt-2 flex-shrink-0" />
								<span>Alertas em tempo real no seu celular</span>
							</li>
							<li className="flex items-start gap-3 text-dark-300 text-sm">
								<div className="w-1.5 h-1.5 bg-primary-purple/100 rounded-full mt-2 flex-shrink-0" />
								<span>Sem precisar abrir o navegador</span>
							</li>
						</ul>
						<a
							href="https://t.me/gibipromo_bot"
							target="_blank"
							rel="noopener noreferrer"
							className="btn-secondary w-full inline-flex items-center justify-center gap-2"
						>
							<Smartphone className="h-5 w-5" />
							<span>Iniciar no Telegram</span>
						</a>
					</div>
				</div>

				{/* Integração */}
				<div className="bg-gradient-to-r from-primary/10 to-primary-yellow/10 border border-primary/20 rounded-2xl p-6 text-center">
					<div className="flex items-center justify-center gap-4 mb-4">
						<Globe className="h-6 w-6 text-primary-yellow" />
						<Link2Icon className="h-5 w-5 text-dark-500" />
						<Smartphone className="h-6 w-6 text-primary-purple" />
					</div>
					<h3 className="text-lg font-bold text-white mb-2">
						Melhor ainda: Use os dois juntos!
					</h3>
					<p className="text-dark-300 text-sm max-w-2xl mx-auto mb-4">
						Faça login no site e vincule ao Telegram para ter acesso completo ao dashboard 
						<strong className="text-white"> e</strong> receber notificações instantâneas no celular.
					</p>
					<Link
						to={isAuthenticated ? "/login" : "/perfil"}
						className="inline-flex items-center gap-2 text-primary hover:text-primary-yellow transition-colors text-sm font-semibold"
					>
						{isAuthenticated ? <span>Vincular telegram</span> : <span>Fazer login e vincular depois</span>}
						<ArrowRight className="h-4 w-4" />
					</Link>
				</div>
			</div>
		</section>
	)
}
