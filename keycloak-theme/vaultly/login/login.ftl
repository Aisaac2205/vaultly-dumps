<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled; section>
    <#if section = "header">
        <#if realm.displayName?has_content>
            ${msg("loginAccountTitle", realm.displayName)}
        <#else>
            ${msg("loginAccountTitle")}
        </#if>
    <#elseif section = "form">
        <div class="vaultly-login-container">
            <!-- Left Panel - Form -->
            <div class="vaultly-form-panel">
                <div class="vaultly-brand">
                    <img src="${url.resourcesPath}/img/favicon.svg" alt="Vaultly" class="vaultly-brand-logo" />
                    <span class="vaultly-brand-name">Vaultly</span>
                </div>

                <h1 class="vaultly-heading">${msg("loginAccountTitle")}</h1>
                <p class="vaultly-subtitle">Gestioná backups, restauraciones y conexiones de bases de datos.</p>

                <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                    <#if messagesPerField.existsError('username','password')>
                        <div class="vaultly-error">
                            ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                        </div>
                    </#if>

                    <div class="vaultly-field-group">
                        <label class="vaultly-label" for="username">
                            <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                        </label>
                        <input
                            id="username"
                            class="vaultly-input"
                            name="username"
                            value="${(login.username!'')}"
                            type="text"
                            autofocus
                            autocomplete="username"
                            placeholder="${msg("username")}"
                        />
                    </div>

                    <div class="vaultly-field-group">
                        <label class="vaultly-label" for="password">${msg("password")}</label>
                        <input
                            id="password"
                            class="vaultly-input"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            placeholder="${msg("password")}"
                        />
                    </div>

                    <#if realm.resetPasswordAllowed>
                        <div class="vaultly-forgot">
                            <a href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                        </div>
                    </#if>

                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                    <button class="vaultly-button" name="login" id="kc-login" type="submit">${msg("doLogIn")}</button>
                </form>
            </div>

            <!-- Right Panel - Showcase -->
            <div class="vaultly-showcase-panel">
                <div class="vaultly-pattern"></div>

                <!-- Floating Icons -->
                <div class="vaultly-floating-icon vaultly-fi-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div class="vaultly-floating-icon vaultly-fi-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="vaultly-floating-icon vaultly-fi-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                </div>
                <div class="vaultly-floating-icon vaultly-fi-4">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>

                <div class="vaultly-showcase">
                    <div class="vaultly-showcase-card">
                        <div class="vaultly-showcase-title">Panel de control</div>

                        <div class="vaultly-showcase-item">
                            <div class="vaultly-showcase-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <div>
                                <p class="vaultly-showcase-primary">Backups automáticos</p>
                                <p class="vaultly-showcase-secondary">Programá y gestioná respaldos</p>
                            </div>
                        </div>

                        <div class="vaultly-showcase-item">
                            <div class="vaultly-showcase-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div>
                                <p class="vaultly-showcase-primary">Cron jobs</p>
                                <p class="vaultly-showcase-secondary">Tareas programadas 24/7</p>
                            </div>
                        </div>

                        <div class="vaultly-showcase-item">
                            <div class="vaultly-showcase-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                            </div>
                            <div>
                                <p class="vaultly-showcase-primary">Almacenamiento R2</p>
                                <p class="vaultly-showcase-secondary">Backups en la nube seguros</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
