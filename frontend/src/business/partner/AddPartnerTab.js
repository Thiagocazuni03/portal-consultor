import Tab from '../../components/Tab.js'
import InputForm from '../../core/InputForm.js'
import UserStorage from '../../core/UserStorage.js'
import APIManager from '../../api/APIManager.js'
import { APPLICATION, PARTNER_URL } from '../../api/Variables.js'
import Translator from '../../translation/Translator.js'

export default class PartnerTab extends Tab {
	constructor(config) {
		super({
			title: Translator.tC('business:new-partner'),
			desc: Translator.tC('areas:description:new-partner'),
			leftButtonText: Translator.t('actions:cancel'),
			rightButtonText: Translator.t('actions:create'),
			onLeftButtonClick: () => this.close(),
			onRightButtonClick: () => this.tryToCreatePartner(),
			...config
		})

		//Inicializando
		this.createPartnersForm()
	}

	/**
	 * Cria o formulário de criação de parceiro
	 */
	async createPartnersForm() {
		this.possibleSegments = await APIManager.getRepository('segment')
		this.partnersForm = new InputForm({ inputs: this.getFields() })
		this.appendToContent(this.partnersForm.getView())
	}

	/**
	 * Tenta processar as informações do formulário e criar um novo parceiro
	 */
	async tryToCreatePartner() {
		const partnerData = this.partnersForm.getValues()
		const createParams = await this.getCreateAPIParams(partnerData)

		const createRequest = await APIManager.doAPIRequest(PARTNER_URL, createParams)
		const wasCreateSucessful = createRequest.errorCode === 0

		wasCreateSucessful
			? this.makeCallbackAndClose({ ...partnerData, segment: partnerData.segment.name, id: Number(createRequest.id) })
			: this.partnersForm.triggerError(createRequest)
	}

	/**
	 * Executa o callback e fecha a aba 
	 */
	makeCallbackAndClose(partnerData) {
		this.config.callback(partnerData)
		this.close()
	}



	/**
	 * Retorna os segmentos formatados para serem usados no formulário 
	 */
	getFormatedSegments() {
		return (this.possibleSegments ?? []).map(segment => {
			return {
				value: segment,
				text: segment.name
			}
		})
	}

	/**
	 * Retorna os campos do formulário 
	 */
	getFields() {
		return [
			{
				key: 'name',
				type: 'text',
				label: Translator.t('common:name'),
				placeholder: Translator.tC('type:partner-name'),
				invalid: Translator.tC('messages:name-cannot-be-blank')
			},
			{
				key: 'email',
				type: 'email',
				label: Translator.t('common:email'),
				placeholder: Translator.tC('type:company-email'),
				invalid: Translator.tC('invalid:email-format')
			},
			{
				key: 'phone',
				label: Translator.t('common:phone'),
				mask: 'phone',
				placeholder: Translator.tC('type:company-phone'),
				invalid: Translator.tC('invalid:phone-format')
			},
			{
				key: 'segment',
				label: Translator.t('common:segment'),
				type: 'select',
				options: this.getFormatedSegments()
			},
		]
	}

	/**
	 * Retorna os parametro para criar um parceiro
	 */
	async getCreateAPIParams({ name, email, phone, segment }) {
		return {
			'type': 'register',
			'application': APPLICATION,
			'data': {
				'member': await UserStorage.getMemberInfo('id'),
				'name': name,
				'email': email,
				'phone': phone,
				'segment': segment
			}
		}
	}
}