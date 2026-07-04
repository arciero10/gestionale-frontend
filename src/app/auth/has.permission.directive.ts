import { Directive, Input, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit {
    private readonly authService = inject(AuthService);
    private requiredPermission = '';
    private hasView = false;

    constructor(
        private readonly templateRef: TemplateRef<unknown>,
        private readonly viewContainer: ViewContainerRef
    ) {}

    @Input()
    set hasPermission(permission: string) {
        this.requiredPermission = permission;
        this.checkPermission();
    }

    ngOnInit(): void {
        this.checkPermission();
    }

    private checkPermission(): void {
        const canView = !this.requiredPermission || this.authService.hasPermission(this.requiredPermission);

        if (canView && !this.hasView) {
            this.hasView = true;
            this.viewContainer.createEmbeddedView(this.templateRef);
            return;
        }

        if (!canView && this.hasView) {
            this.hasView = false;
            this.viewContainer.clear();
        }
    }
}
