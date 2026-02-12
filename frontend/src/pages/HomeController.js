import TabView from "../core/tab-view.js";
import $ from 'jquery'
import PointsProgram from '../components/container/points-program.js';
import Initializer from '../core/Initializer.js'
import VisitReportTab from "../components/container/tabs/visit-report-tab.js";
import WarningTab from "../components/container/tabs/warning-tab.js";
import ResetPassword from "../components/container/reset-password.js";
import WelcomeProgram from "../components/container/tabs/home-tab.js";
import ProspectTab from "../components/container/tabs/prospect-tab.js";
import ClientTab from "../components/container/tabs/client-tab.js";
import LogoutModal from "../business/general/LogoutModal.js";

class HomeController {  
    constructor(){
        const pointsProgram = new PointsProgram();
        const visitReportTab = new VisitReportTab();
        const resetPassword = new ResetPassword();
        const warningTab = new WarningTab();
        const prospectTab = new ProspectTab();
        const clientTab = new ClientTab();
        
        pointsProgram.init();
        

        this.tabs = new TabView({
            defaultTab: 'item-3',
            contentTarget: $('main')
        })

        this.tabs.content.addClass('pd-1')
        this.tabs.appendContent()

        this.tabs
        .addTab({
            id: 'item-1',
            label: 'Principal',
            icon: 'ic-home'
        })
        .addTab({
            id: 'item-2',
            label: 'Agenda',
        })
        .addTab({
            id: 'item-3',
            label: 'Relatórios de Visitas',
        })
        .addTab({
            id: 'item-4',
            label: 'Prospecto',
        })
        .addTab({
            id: 'item-5',
            label: 'Consulta Clientes',
        })
        .addTab({
            id: 'item-6',
            label: 'Sair',
            onSelect: () => {
                // window.location.href = '/home.html'
                new LogoutModal().openModal()
            } 
        })
        
        this.tabs.setContent('item-1', warningTab.getView())
        this.tabs.setContent('item-2', pointsProgram.getView())
        this.tabs.setContent('item-3', visitReportTab.getView())
        this.tabs.setContent('item-4', prospectTab.getView())
        this.tabs.setContent('item-5', clientTab.getView())

        $('.SP__header__options').append(this.tabs.getView())
    } 
}

Initializer.initialize(() => new HomeController())
