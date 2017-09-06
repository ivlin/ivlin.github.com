Rails.application.routes.draw do
  root "static_pages#home"
  get 'home', to: 'static_pages#home'
  get 'education', to: 'static_pages#education'
  get 'experience', to: 'static_pages#experience'
  get 'misc', to: 'static_pages#misc'
  get 'resume', to: 'static_pages#resume'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
