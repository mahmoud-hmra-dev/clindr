FROM node:22-alpine

WORKDIR /usr/src/app

# لو تحتاج build فقط للإنتاج لاحقاً نقدر نعدّل
EXPOSE 4200

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
