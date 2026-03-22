"""
URL configuration for physics_teaching project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    # 捕获 admin/css/... 路径并提供静态文件
    path('admin/css/<path:path>', serve, {'document_root': settings.STATIC_ROOT / 'admin/css'}),
    path('admin/js/<path:path>', serve, {'document_root': settings.STATIC_ROOT / 'admin/js'}),
    path('admin/img/<path:path>', serve, {'document_root': settings.STATIC_ROOT / 'admin/img'}),
    path('admin/', admin.site.urls),
    path('light-reflection/', include('light_reflection.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
