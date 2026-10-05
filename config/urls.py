from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from django.views.generic import RedirectView, TemplateView


urlpatterns = [
    path('api/', include('backend.urls')),
    path('', RedirectView.as_view(url='/start.html', permanent=False)),
    path('start.html', TemplateView.as_view(template_name='start.html')),
    path('table+form.html', TemplateView.as_view(template_name='table+form.html')),
    path('student.html', TemplateView.as_view(template_name='student.html')),
]

# В режиме разработки Django выдаёт CSS, JS и изображения с того же адреса.
for directory in ('css', 'js', 'png'):
    urlpatterns += static(f'/{directory}/', document_root=settings.BASE_DIR / 'frontend' / directory)
