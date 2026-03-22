from django.shortcuts import render

def light_reflection_view(request):
    return render(request, 'light_reflection/light-reflection.html')
