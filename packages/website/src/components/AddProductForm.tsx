import React, { useState, useEffect } from 'react';
import { Link2, Plus, CheckCircle, XCircle, Loader } from 'lucide-react';
import { productsService } from '../api/products.service';

interface AddProductFormProps {
	onSuccess?: () => void;
	compact?: boolean;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({
	onSuccess,
	compact = false
}) => {
	const [url, setUrl] = useState('');
	const [isValidating, setIsValidating] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [validationMessage, setValidationMessage] = useState<{
		type: 'success' | 'error';
		text: string;
	} | null>(null);
	const [submitMessage, setSubmitMessage] = useState<{
		type: 'success' | 'error';
		text: string;
	} | null>(null);

	// Valida URL em tempo real (debounced)
	useEffect(() => {
		if (!url.trim()) {
			setValidationMessage(null);
			return;
		}

		const timeoutId = setTimeout(async () => {
			setIsValidating(true);
			setValidationMessage(null);

			try {
				const result = await productsService.validateUrl(url);

				if (result.valid) {
					setValidationMessage({
						type: 'success',
						text: '✓ URL válida'
					});
				} else {
					setValidationMessage({
						type: 'error',
						text: result.message
					});
				}
			} catch (error) {
				setValidationMessage({
					type: 'error',
					text: 'Erro ao validar URL'
				});
			} finally {
				setIsValidating(false);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [url]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitMessage(null);

		if (!url.trim()) {
			setSubmitMessage({
				type: 'error',
				text: 'Por favor, informe a URL do produto'
			});
			return;
		}

		if (validationMessage?.type === 'error') {
			setSubmitMessage({
				type: 'error',
				text: 'Por favor, corrija a URL antes de continuar'
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await productsService.addProductByUrl(url);

			setSubmitMessage({
				type: 'success',
				text: response.message
			});

			// Limpa formulário
			setUrl('');
			setValidationMessage(null);

			// Callback de sucesso
			if (onSuccess) {
				setTimeout(() => onSuccess(), 2000);
			}
		} catch (error: any) {
			setSubmitMessage({
				type: 'error',
				text: error.message || 'Erro ao adicionar produto'
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Versão compacta (para usar inline em outras páginas)
	if (compact) {
		return (
			<div className="space-y-2">
				<form onSubmit={handleSubmit} className="flex gap-2">
					<div className="flex-1 relative">
						<input
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="Cole o link da Amazon aqui..."
							className="input w-full"
							disabled={isSubmitting}
						/>
						{isValidating && (
							<div className="absolute right-3 top-3.5">
								<Loader className="w-5 h-5 animate-spin text-primary-light" />
							</div>
						)}
					</div>
					<button
						type="submit"
						disabled={isSubmitting || !url.trim() || validationMessage?.type === 'error'}
						className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{isSubmitting ? (
							<Loader className="w-5 h-5 animate-spin" />
						) : (
							<Plus className="w-5 h-5" />
						)}
						Adicionar
					</button>
				</form>

				{/* Validation/Submit Messages */}
				{(validationMessage || submitMessage) && (
					<div className={`text-sm flex items-center gap-2 ${
						(submitMessage?.type || validationMessage?.type) === 'success'
							? 'text-green-400'
							: 'text-red-400'
					}`}>
						{(submitMessage?.type || validationMessage?.type) === 'success' ? (
							<CheckCircle className="w-4 h-4" />
						) : (
							<XCircle className="w-4 h-4" />
						)}
						{submitMessage?.text || validationMessage?.text}
					</div>
				)}
			</div>
		);
	}

	// Versão completa (página dedicada)
	return (
		<div className="card">
			<h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
				<Link2 className="w-6 h-6 text-primary-yellow" />
				Adicionar Produto
			</h2>

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* URL Input */}
				<div>
					<label className="block text-sm font-medium text-primary-light mb-2">
						Link do Produto na Amazon *
					</label>
					<div className="relative">
						<input
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://amazon.com.br/produto/..."
							className="input w-full"
							disabled={isSubmitting}
						/>
						{isValidating && (
							<div className="absolute right-3 top-3.5">
								<Loader className="w-5 h-5 animate-spin text-primary-light" />
							</div>
						)}
					</div>

					{/* Validation Message */}
					{validationMessage && (
						<div className={`mt-2 flex items-center gap-2 text-sm ${
							validationMessage.type === 'success'
								? 'text-green-400'
								: 'text-red-400'
						}`}>
							{validationMessage.type === 'success' ? (
								<CheckCircle className="w-4 h-4" />
							) : (
								<XCircle className="w-4 h-4" />
							)}
							{validationMessage.text}
						</div>
					)}

					<p className="mt-2 text-sm text-dark-400">
						Você pode usar links diretos ou encurtados (amzn.to, a.co)
					</p>
				</div>

				{/* Submit Message */}
				{submitMessage && (
					<div className={`p-4 rounded-xl border ${
						submitMessage.type === 'success'
							? 'bg-green-500/10 border-green-500/20 text-green-400'
							: 'bg-red-500/10 border-red-500/20 text-red-400'
					}`}>
						<div className="flex items-center gap-2">
							{submitMessage.type === 'success' ? (
								<CheckCircle className="w-5 h-5" />
							) : (
								<XCircle className="w-5 h-5" />
							)}
							<p className="font-medium">{submitMessage.text}</p>
						</div>
					</div>
				)}

				{/* Submit Button */}
				<button
					type="submit"
					disabled={isSubmitting || !url.trim() || validationMessage?.type === 'error'}
					className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{isSubmitting ? (
						<>
							<Loader className="w-5 h-5 animate-spin" />
							Adicionando...
						</>
					) : (
						<>
							<Plus className="w-5 h-5" />
							Adicionar Produto
						</>
					)}
				</button>
			</form>

			{/* Info Box */}
			<div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
				<h3 className="font-medium text-primary-yellow mb-2">
					Como funciona?
				</h3>
				<ul className="text-sm text-primary-light space-y-1">
					<li>• Cole o link de qualquer produto da Amazon</li>
					<li>• O produto será analisado em até 5 minutos</li>
					<li>• Você receberá notificações quando o preço cair</li>
					<li>• Acompanhe todos os seus produtos na aba "Promoções"</li>
				</ul>
			</div>
		</div>
	);
};
