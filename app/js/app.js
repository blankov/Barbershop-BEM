document.addEventListener('DOMContentLoaded', () => {
   // Custom JS

   // HEADER MENU TOGGLE

   const siteNav   = document.querySelector('.site-nav');
   const toggleNav = document.querySelector('.site-nav__toggle');

   siteNav.classList.remove('site-nav--nojs');

   toggleNav.addEventListener('click', () => {
      if (siteNav.classList.contains('site-nav--closed')) {
         siteNav.classList.remove('site-nav--closed');
         siteNav.classList.add('site-nav--opened');
      } else {
         siteNav.classList.remove('site-nav--opened');
         siteNav.classList.add('site-nav--closed');
      }
   });
});
