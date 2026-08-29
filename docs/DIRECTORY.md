# Directory Map

```text
api/
  index.js, _db.js
  config/index.js
  middleware/{auth,cors,error,request-limit}.middleware.js
  controllers/{auth,project,folder}.controller.js
  services/{auth,project,folder}.service.js
  repositories/{user,project,folder}.repository.js
  models/{user,project,folder,workflow}.model.js
  validators/{auth,project,folder}.validator.js
frontend/
  core/auth/auth.js
  core/persistence/shared.js
  dashboard/dashboard.controller.js
  builder/builder.controller.js
  onboarding/onboarding.controller.js
public/{css,assets}/
auth/google-callback.html
{index,builder,onboarding}.html
vercel.json, package.json, README.md
```

The old `js/` runtime copies were removed after repository-wide reference checks. Root `css/` and `assets/` remain as compatibility static paths; active pages use `public/`.
